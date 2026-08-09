import mongoose from 'mongoose';
import User from '../models/user.model.js';
import UserExtension from '../models/extendedUser.model.js';
import Permission from '../models/permission.model.js';
import dotenv from 'dotenv';

dotenv.config();

class SuperAdminInitializer {
  static async initializePermissions() {
    console.log('Initializing permissions...');
    
    const permissions = [
      // User Management
      { name: 'manage_users', description: 'إدارة المستخدمين وتغيير أدوارهم', category: 'user_management' },
      
      // Seller Management  
      { name: 'manage_sellers', description: 'إدارة البائعين والموافقة على حساباتهم', category: 'user_management' },
      
      // Financial Management
      { name: 'manage_wallets', description: 'إدارة المحافظ وتعديل الأرصدة', category: 'financial' },
      
      // Order Management
      { name: 'manage_orders', description: 'إدارة جميع الطلبات في النظام', category: 'content' },
      
      // Product Management
      { name: 'manage_products', description: 'إدارة جميع المنتجات في النظام', category: 'content' },
      
      // System Settings
      { name: 'manage_settings', description: 'إدارة إعدادات النظام', category: 'system' },
      
      // Analytics Access
      { name: 'manage_analytics', description: 'الوصول إلى التحليلات والإحصائيات', category: 'analytics' },
      
      // Support Management
      { name: 'manage_support', description: 'إدارة تذاكر الدعم والتواصل', category: 'user_management' },
      
      // Content Management
      { name: 'manage_content', description: 'إدارة المحتوى والإعلانات', category: 'content' },
      
      // System Administration
      { name: 'manage_system', description: 'صلاحيات النظام الكاملة', category: 'system' }
    ];

    for (const permission of permissions) {
      await Permission.findOneAndUpdate(
        { name: permission.name },
        permission,
        { upsert: true, new: true }
      );
    }

    console.log('Permissions initialized successfully');
  }

  static async createSuperAdmin(email = 'admin@mirvory.com') {
    console.log(`Creating super admin with email: ${email}`);
    
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ email });
    if (existingSuperAdmin) {
      console.log('Super admin already exists');
      return existingSuperAdmin;
    }

    // Create super admin user
    const superAdmin = new User({
      firstName: 'Super',
      lastName: 'Admin',
      email,
      password: 'SuperAdmin123!@#', // Change this in production
      role: 'admin', // Keep original role for backward compatibility
      isVerified: true,
      isActive: true,
      phone: '01000000000',
      addresses: new mongoose.Types.ObjectId() // Will need to be set properly
    });

    await superAdmin.save();

    // Create user extension with super admin role
    const allPermissions = await Permission.find({});
    const superAdminExtension = new UserExtension({
      userId: superAdmin._id,
      extendedRole: 'super_admin',
      adminProfile: {
        permissions: allPermissions.map(p => p._id),
        department: 'management',
        accessLevel: 'full',
        twoFactorEnabled: false,
        backupCodes: []
      },
      financialControl: {
        isFrozen: false,
        adjustmentHistory: [],
        withdrawalLimits: {
          daily: 1000000,
          monthly: 10000000
        },
        requiresApproval: false
      }
    });

    await superAdminExtension.save();

    console.log('Super admin created successfully');
    console.log(`Email: ${email}`);
    console.log('Password: SuperAdmin123!@# (CHANGE IN PRODUCTION)');
    
    return superAdmin;
  }

  static async migrateExistingUsers() {
    console.log('Migrating existing users...');
    
    const existingUsers = await User.find({});
    
    for (const user of existingUsers) {
      const existingExtension = await UserExtension.findOne({ userId: user._id });
      
      if (!existingExtension) {
        // Create extension for existing users
        const userExtension = new UserExtension({
          userId: user._id,
          extendedRole: user.role, // Map existing role to extended role
          financialControl: {
            isFrozen: false,
            adjustmentHistory: [],
            withdrawalLimits: {
              daily: user.role === 'seller' ? 10000 : 1000,
              monthly: user.role === 'seller' ? 100000 : 10000
            },
            requiresApproval: false
          }
        });

        // Give admins basic permissions if they don't have extensions
        if (user.role === 'admin') {
          const basicPermissions = await Permission.find({
            name: { $in: ['manage_users', 'manage_orders', 'manage_analytics'] }
          });
          
          userExtension.adminProfile = {
            permissions: basicPermissions.map(p => p._id),
            department: 'management',
            accessLevel: 'limited',
            twoFactorEnabled: false,
            backupCodes: []
          };
        }

        await userExtension.save();
      }
    }

    console.log('Existing users migrated successfully');
  }

  static async run() {
    try {
      // Connect to database
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mirvory');
      console.log('Connected to database');

      // Initialize permissions
      await this.initializePermissions();

      // Create super admin
      await this.createSuperAdmin();

      // Migrate existing users
      await this.migrateExistingUsers();

      console.log('Super Admin system initialization completed successfully!');

    } catch (error) {
      console.error('Initialization error:', error);
      process.exit(1);
    } finally {
      await mongoose.disconnect();
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  SuperAdminInitializer.run();
}

export default SuperAdminInitializer;

// المسار: src/cron/wallet.cron.js
import User from '../models/user.model.js';

export const releaseDueBalancesCron = async () => {
    try {
        const currentDate = new Date();

        const users = await User.find({
            'wallet.pendingTransactions': {
                $elemMatch: {
                    status: 'pending',
                    releaseDate: { $lte: currentDate }
                }
            }
        });

        if (users.length === 0) {
            console.log(`[${new Date().toISOString()}] لا توجد أرصدة مستحقة للتحرير اليوم.`);
            return;
        }

        let totalReleased = 0;

        for (const user of users) {
            let amountToRelease = 0;

            user.wallet.pendingTransactions.forEach(tx => {
                if (tx.status === 'pending' && tx.releaseDate <= currentDate) {
                    amountToRelease += tx.amount;
                    tx.status = 'released';
                }
            });

            if (amountToRelease > 0) {
                user.wallet.balance += amountToRelease;
                user.wallet.pendingBalance -= amountToRelease;

                await user.save({ validateModifiedOnly: true });
                totalReleased += amountToRelease;
            }
        }

        console.log(`[${new Date().toISOString()}] تم تحرير أرصدة بقيمة ${totalReleased} لعدد ${users.length} بائع.`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] خطأ في مهمة تحرير الأرصدة:`, error);
    }
};
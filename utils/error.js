class createError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.status = statusCode;
        this.statusText = `${statusCode}`.startsWith(4) ? "fail" : 'error';
        this.isOperational = true;
        
        // Capture the stack trace, excluding the constructor call from it
        Error.captureStackTrace(this, this.constructor);
    }
}

export default createError;

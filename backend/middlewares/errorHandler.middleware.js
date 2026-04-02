export default (err, req, res, next) => {
    const statusCode = err.code || err.status || 500;
    let message = err.message || "Internal Server Error";
    if (Array.isArray(err)) {
        message = err[0].msg; 
    }

    res.status(statusCode).json({
        success: false,
        message: message
    });
};
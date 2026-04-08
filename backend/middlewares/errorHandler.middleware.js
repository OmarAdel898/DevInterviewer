export default (err, req, res, next) => {
    let statusCode = Number(err?.statusCode || err?.status);
    if (!statusCode || statusCode < 400 || statusCode > 599) {
        statusCode = 500;
    }

    let message = err?.message || "Internal Server Error";
    if (Array.isArray(err)) {
        message = err[0]?.msg || message;
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(Array.isArray(err?.details) ? { errors: err.details } : {})
    });
};
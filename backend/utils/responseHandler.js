export const sendResponse = (res, data, message, status = 200) => {
    return res.status(status).json({
        success: true,
        message,
        data: data
    });
};
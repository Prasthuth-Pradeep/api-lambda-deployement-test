export const lambdaHandler = async (event, context) => {
    try {
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "hello earth",
            })
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Internal Server Error",
            })
        };
    }
};

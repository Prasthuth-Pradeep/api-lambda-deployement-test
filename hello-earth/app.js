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

export const postHandler = async (event, context) => {
    try {
        console.log("Received POST:", event);
        const body = JSON.parse(event.body || "{}");
        console.log("Received body:", body);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Hello Earth POST received!",
                receivedData: body
            })
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error processing POST" })
        };
    }
};

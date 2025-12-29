export const lambdaHandler = async (event, context) => {
    try {
        console.time("PerformanceCheck"); // Start timer

        // Create a deep object to demonstrate console.dir
        const complexObject = {
            user: {
                details: {
                    name: "Sam Local",
                    roles: ["admin", "developer"],
                    meta: {
                        lastLogin: "today",
                        source: "CLI"
                    }
                }
            }
        };

        console.log("--- Standard Log vs Dir ---");
        console.log("Standard Log:", complexObject);
        console.dir(complexObject, { depth: null, colors: true }); // Show full depth

        console.log("--- Stack Trace ---");
        console.trace("Where am I?"); // Show stack trace

        console.timeEnd("PerformanceCheck"); // End timer and print duration

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "hello world",
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
        const body = JSON.parse(event.body);

        console.log("Received POST request with body:", body);
        console.log("Received Headers:", event.headers);
        console.log("Lambda Context:", context);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Data received!",
                input: body
            })
        };
    } catch (err) {
        console.error("Error processing POST request:", err);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Internal Server Error"
            })
        };
    }
};

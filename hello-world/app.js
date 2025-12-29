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

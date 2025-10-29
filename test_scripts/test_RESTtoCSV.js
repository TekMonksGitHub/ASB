exports.runTestsAsync = async function (argv) {
    if ((argv[0]) && (argv[0].toLowerCase() != "resttocsv")) {
        ASBLOG.info(`Skipping RESTtoCSV, not called.\n`)
        return;
    }
    try {
        const response = await fetch('http://127.0.0.1:9090/tocsv', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                "firstname": "testing",
                "lastname": "flow"
            })
        });
        if (!response.ok) {
            throw new Error(`[test_RESTtoCSV] HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        ASBLOG.info({ result: true, output: data.response });
        return true;
    } catch (err) {
        ASBLOG.info({ result: false, err: "[test_RESTtoCSV] error in that flow ." });
        return err;
    }
}
exports.runTestsAsync = async function (argv) {
    if ((argv[0]) && (argv[0].toLowerCase() != "resthello")) {
        LOG.info(`Skipping RESThello flow, not called.\n`)
        return 'skipped';
    }
    try {
        const response = await fetch('http://127.0.0.1:9090/hello', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        if (!response.ok) {
            throw new Error(`[test_RESThello] HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        LOG.info({ result: true, output: data.response });
        return true;
    } catch (err) {
        LOG.info({ result: false, err: "[test_RESThello] error in that flow ." });
        return err;
    }
}
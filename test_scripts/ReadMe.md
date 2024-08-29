
# Testing Script for ASB

This repository contains the `testMain.js` script designed to execute test cases for ASB. It sets up the testing environment, runs the specified tests, and generates a detailed report of the results.

## Structure

The script requires a JSON configuration that specifies the directory and the list of test files to execute.

```json
{
    "testCasesDir": "/path/to/test_scripts/",
    "testFiles": [
        "test_example1.js",
        "test_example2.js"
    ]
}
```

### Description

- **`testCasesDir`**: Specifies the directory containing the test script files.
- **`testFiles`**: An array of test script file names that should be executed.
- Each test file must export a `runTestsAsync` function.

## Command Line Arguments (ARGVs)

- **`argv[0]`**: Path to the test cases directory _(required)_.
- **`argv[1]` and onwards**: Additional parameters passed to individual test cases _(optional)_.

## Conventions for Test Files

All test files should follow these conventions:

1. **Naming Convention**:
   - File names must be in the format: `test_<testname>.js`.
   
2. **Exported Function**:
   - Each test file should export a `runTestsAsync` function.
   
3. **Return Values**:
   - The function should return one of the following:
     - `'skipped'`: To indicate the test was skipped.
     - `true`: To indicate the test passed.
     - An object with an error message, e.g., `{ error: 'Description of error' }`: To indicate the test failed.

## Execution

To execute the testing script, use the following command:

```bash
node testMain.js /path/to/test_scripts/ [additional parameters]
```

### Example

```bash
node testMain.js /test_scripts/ --verbose
```

## Report Generation

The script generates a report for each test case, which includes:

- **Test Case Name**: The name of the test case file.
- **Result**: Indicates if the test passed, failed, or was skipped.
- **Message**: An optional message providing more details, typically used for failure messages.
- **Start and End Time**: Timestamps for when the test began and concluded.

## Server Process

> **Note**: The script spawns a server process (`asb.js`) required for testing. Ensure that `asb.js` is present in the appropriate directory before running the tests.

## Example Test File

Here is an example of a test file following the conventions:

```javascript
// test_example1.js

export async function runTestsAsync(argv) {
    try {
        // Add your test logic here
        const result = await performTestLogic(argv);
        if (result.success) {
            return true; // Test passed
        } else {
            return { error: result.message }; // Test failed
        }
    } catch (err) {
        return { error: err.message }; // Return error if exception occurs
    }
}

async function performTestLogic(argv) {
    // Simulate test logic
    return { success: true };
}
```

### Guidelines for Writing Test Files

- Ensure all test files have clear, descriptive names following the format `test_<testname>.js`.
- Use the `runTestsAsync` function to encapsulate all test logic.
- Return appropriate responses for different test outcomes.

## Dependencies

The testing script relies on Node.js to run. Ensure Node.js is installed on your system before executing the tests.


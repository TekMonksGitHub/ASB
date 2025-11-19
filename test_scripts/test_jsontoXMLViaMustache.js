const fs = require('fs');
const Mustache = require('mustache');
const path=require("path")

exports.runTestsAsync = async function (argv) {
    if ((argv[0]) && (argv[0].toLowerCase() != "jsontoxml")) {
        ASBLOG.info("Skipping jsontoxml flow, not called.\n")
        return 'skipped';
    }
    try {
        let result;
        let output = await createAndMoveFile();
        if (output === true) {
            result = true;
            ASBLOG.info("XML file created and content matches.");
        } else if (output === false) {
            result = {}
            result.message = "XML file created but content does not match.";
        } else {
            result = {}
            ASBLOG.info({ result: false, err: "[test_jsontoxml] error in that flow.", error: result });
            result.message = output.message;
        }
        return result;
    } catch (err) {
        ASBLOG.info({ result: false, err: "[test_jsontoxml] error in that flow.", error: err });
        return err;
    }
}
async function createAndMoveFile() {
    try {
        const jsonContent = {
            "OrderNumber": "32940292042",
            "Sender": "Tekmonks Corp",
            "OrderDate": "20210521",
            "Currency": "EUR",
            "SoldToPartnerNumber": "TKMASB01",
            "SupplierPartnerNumber": "ASB",
            "EndClientPONumber": "TKM4828429",
            "ItemsOrdered": [
                {"ItemNumber": "24424242",
                "Quantity": 2,
                "UnitOfMeasure": "Instance",
                "DeliveryDate": "20210523",
                "Materials":[
                {"CustomerMaterialNumber": "ESB01",
                "MaterialID": "ESB",
                "MaterialShortDescription": "ESB Bus"}
                ]
                },
                {"ItemNumber": "24424243",
                "Quantity": 2,
                "UnitOfMeasure": "Instance",
                "DeliveryDate": "20210523",
                "Materials":[
                {"CustomerMaterialNumber": "APIGW01",
                "MaterialID": "APIGW",
                "MaterialShortDescription": "API Gateway"},
                {"CustomerMaterialNumber": "APISGW01",
                    "MaterialID": "APISGW",
                    "MaterialShortDescription": "API Security Gateway"}
                ]
                }
            ]
        }
        const templatePath = `${ASBCONSTANTS.ROOTDIR}/testing/json2SAP_ORDERS05.xml`;
        const template = fs.readFileSync(templatePath, 'utf8');
        const JsonFilePath = `${ASBCONSTANTS.ROOTDIR}/json2SAP_ORDERS05.json`;
        const newJsonFilePath = `${ASBCONSTANTS.ROOTDIR}/testing/in/json2SAP_ORDERS05.json`;
        const xmlFilePath = `${ASBCONSTANTS.ROOTDIR}/testing/json2xml_out_SAP_ORDERS05.xml`;
        fs.writeFileSync(JsonFilePath, JSON.stringify(jsonContent, null, 2));
        fs.mkdirSync(path.dirname(newJsonFilePath), { recursive: true });
        fs.renameSync(JsonFilePath, newJsonFilePath);
        await new Promise(resolve => setTimeout(resolve, 5000));
        try {
            fs.accessSync(xmlFilePath);
            const xmlContent = fs.readFileSync(xmlFilePath, 'utf8');
            const expectedXmlContent = Mustache.render(template, jsonContent);
            const isDataMatching = xmlContent.trim() === expectedXmlContent.trim();
            if (isDataMatching) {
                console.log('XML file content matches the expected content.');
                return true;
            } else {
                console.error('XML file content does not match the expected content.');
                return false;
            }
        } catch (err) {
            console.error('XML file does not exist:', err);
            return err;
        }
    } catch (err) {
        console.error('Error:', err);
        return err;
    }
}
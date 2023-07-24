var express = require("express");
var StellarSdk = require("stellar-sdk");
const { Account, Asset, Transaction, Server } = require("stellar-sdk");

require("dotenv").config();
var app = express();

var cors = require("cors");
app.use(cors({ optionsSuccessStatus: 200 }));

const networkPassphrase = "Test SDF Future Network ; October 2022";
const server = new StellarSdk.Server("https://horizon-futurenet.stellar.org");

function getAccount() {
  let account = StellarSdk.Keypair.fromSecret(process.env.PRIVATE_KEY);

  return account;
}

app.get("/", function (req, res) {
  res.send("Server is Running");
});

app.get("/get-wallet", function (req, res) {
  let account = getAccount();

  res.json({ wallet: account.publicKey() });
});

app.post("/create-trustline", async function (req, res) {
  try {
    const userKeyPair = getAccount();

    // Fetch the user account's current sequence number
    const account = await server.loadAccount(userKeyPair.publicKey());

    // Build the transaction to create the trustline
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: new StellarSdk.Asset("ARTY", process.env.ISSUER_KEY),
          limit: "1000",
        })
      )
      .setTimeout(30)
      .build();

    // Sign the transaction with the user's secret key
    transaction.sign(userKeyPair);

    // Submit the transaction to the network
    const transactionResult = await server.submitTransaction(transaction);
    console.log("Trustline created successfully!", transactionResult.successful);

    res.send("Trustline created successfully");
  } catch (error) {
    console.error("Error creating trustline:", error.response?.data || error);
    console.log("Operations result codes:", error.response?.data?.extras?.result_codes?.operations);
    res.send(
      "Error creating trustline - Operations result codes:",
      error.response?.data?.extras?.result_codes?.operations
    );
  }
});

var listener = app.listen(5588, function () {
  console.log("Your app is listening on port " + listener.address().port);
});

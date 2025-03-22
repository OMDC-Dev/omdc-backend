const { fetchApi } = require("../utils/apiService");
const { Responder } = require("../utils/responder");

exports.getBank = async (req, res) => {
  try {
    const { state, result } = await fetchApi({
      url: "https://api-rekening.lfourr.com/listBank",
      method: "GET",
    });

    if (state == "OK") {
      Responder(res, "OK", null, result?.data, 200);
      return;
    } else {
      Responder(res, "ERROR", null, null, 400);
      return;
    }
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

exports.getBankAccName = async (req, res) => {
  const { code, number } = req.query;

  if (code == "014" && number == "123456") {
    Responder(
      res,
      "OK",
      null,
      {
        bankcode: "014",
        bankname: "BANK BCA",
        accountnumber: number,
        accountname: "Dev Bank",
      },
      200
    );
    return;
  }

  try {
    const { state, result } = await fetchApi({
      url: `https://api-rekening.lfourr.com/getBankAccount?bankCode=${code}&accountNumber=${number}`,
      method: "GET",
    });

    if (state == "OK") {
      if (result.status) {
        Responder(res, "OK", null, result?.data, 200);
        return;
      } else {
        Responder(res, "ERROR", result.msg, null, 400);
        return;
      }
    } else {
      Responder(res, "ERROR", null, null, 400);
      return;
    }
  } catch (error) {
    Responder(res, "ERROR", null, null, 400);
    return;
  }
};

// 7480308748

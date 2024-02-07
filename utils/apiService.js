const axios = require("axios");

const fetchApi = async (props) => {
  const { url, method, data, headers } = props;

  let customHeaders = {
    ...headers,
    "Content-Type": "application/json",
  };

  try {
    return axios({
      url: url,
      method: method || "GET",
      data: data,
      headers: customHeaders,
    })
      .then((resData) => {
        return { state: "OK", result: resData?.data };
      })
      .catch((error) => {
        return {
          state: "ERROR",
          result: error?.response?.data,
        };
      });
  } catch (error) {
    return {
      state: "ERROR",
      result: error?.response?.data,
    };
  }
};

module.exports = { fetchApi };

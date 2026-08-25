export default async function handler(req, res) {
  try {
    const twseUrl =
      "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL";

    const tpexUrl =
      "https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes";

    const [twseResponse, tpexResponse] = await Promise.all([
      fetch(twseUrl),
      fetch(tpexUrl)
    ]);

    if (!twseResponse.ok) {
      throw new Error("TWSE API 讀取失敗");
    }

    if (!tpexResponse.ok) {
      throw new Error("TPEx API 讀取失敗");
    }

    const twseData = await twseResponse.json();
    const tpexData = await tpexResponse.json();

    const twseStocks = twseData.map(item => ({
      market: "上市",
      code: String(item.Code || "").trim(),
      name: String(item.Name || "").trim(),
      date: item.Date || "",
      closingPrice: item.ClosingPrice || "",
      openingPrice: item.OpeningPrice || "",
      highestPrice: item.HighestPrice || "",
      lowestPrice: item.LowestPrice || "",
      change: item.Change || ""
    }));

    const tpexStocks = tpexData.map(item => ({
      market: "上櫃",

      code: String(
        item.SecuritiesCompanyCode ||
        item.Code ||
        item["證券代號"] ||
        ""
      ).trim(),

      name: String(
        item.CompanyName ||
        item.Name ||
        item["證券名稱"] ||
        ""
      ).trim(),

      date:
        item.Date ||
        item["資料日期"] ||
        "",

      closingPrice:
        item.Close ||
        item.ClosingPrice ||
        item["收盤價"] ||
        "",

      openingPrice:
        item.Open ||
        item.OpeningPrice ||
        item["開盤價"] ||
        "",

      highestPrice:
        item.High ||
        item.HighestPrice ||
        item["最高價"] ||
        "",

      lowestPrice:
        item.Low ||
        item.LowestPrice ||
        item["最低價"] ||
        "",

      change:
        item.Change ||
        item["漲跌"] ||
        item["漲跌價差"] ||
        ""
    }));

    const allStocks = [
      ...twseStocks,
      ...tpexStocks
    ];

    res.setHeader(
      "Cache-Control",
      "s-maxage=60, stale-while-revalidate=300"
    );

    return res.status(200).json(allStocks);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "無法取得上市／上櫃股票資料",
      message: error.message
    });
  }
}

import qs from "qs";


export class GoogleTranslationRes {
    pronunciation: string;
    correction: Correction;
    translation: string[];
    input: string[];
    definitions: Definition[];
    examples: string[];
    seeAlso: string[];
    synonyms: string[];
    translations: Translation[];
    rawResult: string;
}

function extract(key, res) {
    var re = new RegExp(`"${key}":".*?"`);
    var result = re.exec(res);
    if (result !== null) {
        return result[0].replace(`"${key}":"`, "").slice(0, -1);
    }
    return "";
}

export async function translate(text, opts): Promise<GoogleTranslationRes> {
    try {
        let url = "https://translate.google.com";

        let translationRes = await fetch(url)
            .then((result) => {
                return result.text();
            })
            .then((resHTML) => {
                var data = {
                    rpcids: "MkEWBc",
                    "f.sid": extract("FdrFJe", resHTML),
                    bl: extract("cfb2h", resHTML),
                    hl: "en-US",
                    "soc-app": 1,
                    "soc-platform": 1,
                    "soc-device": 1,
                    _reqid: Math.floor(1000 + Math.random() * 9000),
                    rt: "c",
                };
                return data;
            })
            .then(async (reqData) => {
                url =
                    url +
                    "/_/TranslateWebserverUi/data/batchexecute?" +
                    qs.stringify(reqData, { indices: false });
                let body =
                    "f.req=" +
                    encodeURIComponent(
                        JSON.stringify([
                            [
                                [
                                    "MkEWBc",
                                    JSON.stringify([[text, opts.from, opts.to, true], [null]]),
                                    null,
                                    "generic",
                                ],
                            ],
                        ])
                    ) +
                    "&";
                let contentType = "application/x-www-form-urlencoded;charset=UTF-8";

                let translationFinalRes = await fetch(url, {
                    method: "POST",
                    body,
                    headers: { "content-type": contentType },
                })
                    .then((res) => {
                        return res.text();
                    })
                    .then((res) => {
                        return res;
                    });

                return translationFinalRes;
            })
            .catch((err) => console.log(err));

        return remapTranslate(translationRes);
    } catch (err) {
        console.error(err);
        return null;
    }
}
function remapTranslate(data) {
    var json = data.slice(6);
    var length = "";

    var result: GoogleTranslationRes = new GoogleTranslationRes();

    try {
        length = /^\d+/.exec(json)[0];
        json = JSON.parse(json.slice(length.length, parseInt(length, 10) + length.length));
        json = JSON.parse(json[0][2]);
    } catch (e) {
        console.error(e);
        return result;
    }

    result = {
        pronunciation: json[0][0],
        correction: json[0][1] && json[0][1],
        translation:
            json[1][0] &&
            json[1][0][0] &&
            json[1][0][0][5] &&
            json[1][0][0][5][0] &&
            json[1][0][0][5][0][0],
        input: json[1][4],
        definitions:
            json[3] &&
            json[3][1] &&
            json[3][1][0].map(
                (d): Definition => {
                    return {
                        type: d[0],
                        content: d[1].map(
                            (contentOfThisType): DefinitionContent => {
                                return {
                                    definition: contentOfThisType[0],
                                    example: contentOfThisType[1],
                                };
                            }
                        ),
                    };
                }
            ), // verb, noun, adjective
        examples: json[3] && json[3][2] && json[3][2][0].map((item) => item[1]),
        seeAlso: json[3] && json[3][3] && json[3][3][0],
        synonyms: json[3] && json[3][4] && json[3][4][0], // verb, noun, adjective
        translations:
            json[3] &&
            json[3][5] &&
            json[3][5][0].map(
                (t): Translation => {
                    return {
                        type: t[0],
                        content: t[1].map(
                            (contentOfThisType): TranslationContent => {
                                return {
                                    meaning: contentOfThisType[0],
                                    words: contentOfThisType[2],
                                    bar: contentOfThisType[3],
                                    rating: contentOfThisType[3],
                                };
                            }
                        ),
                    };
                }
            ), // verb, noun, adjective
        rawResult: json,
    };
    return result;
}

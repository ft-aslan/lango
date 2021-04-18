import qs from "qs";
import getToken from "./google-translate-token.js";

class Language {
    didYouMean: boolean = false;
    iso: string = "";
}
class AutoCorrectionText {
    autoCorrected: boolean = false;
    value: string = "";
    didYouMean: boolean = false;
}
class Correction {
    language: Language = new Language();
    text: AutoCorrectionText = new AutoCorrectionText();
}

class Translation {
    type: string = "";
    content: TranslationContent[];
}

class TranslationContent {
    article?: string;
    word: string;
    meaning: string[];
    rating: number;
    bar: string;
}

export class GoogleTranslationRes {
    text: string;
    pronunciation: string;
    from: {
        language: {
            didYouMean: boolean;
            iso: string;
        };
        text: {
            autoCorrected: boolean;
            value: string;
            didYouMean: boolean;
        };
    };
    raw: string;
}

interface TranslationReqTemplate {
    client: string;
    sl: string;
    tl: string;
    hl: string;
    dt: string[];
    ie: string;
    oe: string;
    q: string;
    tk: string;
}

function extract(key, res) {
    var re = new RegExp(`"${key}":".*?"`);
    var result = re.exec(res);
    if (result !== null) {
        return result[0].replace(`"${key}":"`, "").slice(0, -1);
    }
    return "";
}

export async function translate(text, opts, justDefinition): Promise<GoogleTranslationRes> {
    try {
        let url = "https://translate.google.com";
        let oldData: TranslationReqTemplate = {
            client: "t",
            sl: opts.from,
            tl: opts.to,
            hl: opts.from,
            dt: ["md", "at", "bd", "ex", "ld", "qca", "rw", "rm", "ss", "t"],
            ie: "UTF-8",
            oe: "UTF-8",
            q: text,
            tk: null /*tokenRet*/,
        };
        if (!justDefinition) {
            let allOtherOptions = ["at", "bd", "ex", "ld", "qca", "rw", "rm", "ss", "t"];
            oldData.dt.concat(allOtherOptions);
        }

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
                        console.log(res);
                        return res;
                    });

                return translationFinalRes;
            })
            .catch((err) => console.log(err));

        // let res = await fetch(url + "?" + qs.stringify(data, { indices: false }))
        //     .then((result) => {
        //         return result.json();
        //     })
        //     .then((resJson) => {
        //         return resJson;
        //     })
        //     .catch((err) => console.log(err));

        if (justDefinition) {
            return remapJustDefinition(translationRes);
        } else return remapTranslate(translationRes);
    } catch (err) {
        console.error(err);
        return null;
    }
}
function remapJustDefinition(data): GoogleTranslationRes {
    var resultDefination: GoogleTranslationRes = new GoogleTranslationRes();

    if (data[12]) {
        var definitions = [];

        for (let i = 0; i < data[12].length; i++) {
            let type = data[12][i][0];
            let content = [];

            for (let j = 0; j < data[12][i][1].length; j++) {
                let obj = {
                    phrase: data[12][i][1][j][0],
                    instance: data[12][i][1][j][2],
                };
                content.push(obj);
            }
            let section = {
                type,
                content,
            };
            definitions.push(section);
        }
        resultDefination.definitions = definitions;
    }

    return resultDefination;
}
function remapTranslate(data) {
    var json = data.slice(6);
    var length = "";

    var result: GoogleTranslationRes = {
        text: "",
        pronunciation: "",
        from: {
            language: {
                didYouMean: false,
                iso: "",
            },
            text: {
                autoCorrected: false,
                value: "",
                didYouMean: false,
            },
        },
        raw: "",
    };

    try {
        length = /^\d+/.exec(json)[0];
        json = JSON.parse(json.slice(length.length, parseInt(length, 10) + length.length));
        json = JSON.parse(json[0][2]);
        result.raw = json;
    } catch (e) {
        return result;
    }

    if (json[1][0][0][5] === undefined || json[1][0][0][5] === null) {
        // translation not found, could be a hyperlink or gender-specific translation?
        result.text = json[1][0][0][0];
    } else {
        result.text = json[1][0][0][5]
            .map(function (obj) {
                return obj[0];
            })
            .filter(Boolean)
            // Google api seems to split text per sentences by <dot><space>
            // So we join text back with spaces.
            // See: https://github.com/vitalets/google-translate-api/issues/73
            .join(" ");
    }
    result.pronunciation = json[1][0][0][1];

    // From language
    if (json[0] && json[0][1] && json[0][1][1]) {
        result.from.language.didYouMean = true;
        result.from.language.iso = json[0][1][1][0];
    } else if (json[1][3] === "auto") {
        result.from.language.iso = json[2];
    } else {
        result.from.language.iso = json[1][3];
    }

    // Did you mean & autocorrect
    if (json[0] && json[0][1] && json[0][1][0]) {
        var str = json[0][1][0][0][1];

        str = str.replace(/<b>(<i>)?/g, "[");
        str = str.replace(/(<\/i>)?<\/b>/g, "]");

        result.from.text.value = str;

        if (json[0][1][0][2] === 1) {
            result.from.text.autoCorrected = true;
        } else {
            result.from.text.didYouMean = true;
        }
    }
    console.log(result);
    
    return result;
    // var obj: GoogleTranslationRes = new GoogleTranslationRes();

    // if (data[2] === data[8][0][0]) {
    //     obj.correction.language.iso = data[2];
    // } else {
    //     obj.correction.language.didYouMean = true;
    //     obj.correction.language.iso = data[8][0][0];
    // }

    // if (data[7] && data[7][0]) {
    //     var youMean = data[7][1];
    //     obj.correction.text.value = youMean;

    //     if (data[7][5] === true) {
    //         obj.correction.text.autoCorrected = true;
    //     } else {
    //         obj.correction.text.didYouMean = true;
    //     }
    // }

    // if (data[0]) {
    //     let length = data[0].length;
    //     let input = [];
    //     let translation = [];
    //     obj.target = data[0][0][1] || null;

    //     for (let i = 0; i < length; i++) {
    //         if (data[0][i][1] !== null) {
    //             input.push(data[0][i][1]);
    //             translation.push(data[0][i][0]);
    //         }
    //     }
    //     obj.input = input;
    //     obj.text = input.join("");
    //     obj.translation = translation.join("");
    // }

    // if (data[0][1]) {
    //     obj.pronunciation = data[0][1][3];
    // }

    // if (data[1]) {
    //     var translations = [];

    //     for (let i = 0; i < data[1].length; i++) {
    //         let type = data[1][i][0];
    //         let content = [];

    //         for (let j = 0; j < data[1][i][2].length; j++) {
    //             var rating = data[1][i][2][j][3];
    //             var bar;

    //             switch (true) {
    //                 case rating > 0.05:
    //                     bar = "common";
    //                     break;
    //                 case rating < 0.05 && rating > 0.002:
    //                     bar = "uncommon";
    //                     break;
    //                 case rating < 0.002:
    //                     bar = "rare";
    //                     break;
    //                 case rating === undefined:
    //                     bar = "rare";
    //             }

    //             let obj = {
    //                 article: data[1][i][2][j][4] || null,
    //                 word: data[1][i][2][j][0],
    //                 meaning: data[1][i][2][j][1],
    //                 rating,
    //                 bar,
    //             };

    //             content.push(obj);
    //         }

    //         let section = {
    //             type,
    //             content,
    //         };

    //         translations.push(section);
    //     }

    //     obj.translations = translations;
    // }

    // if (data[12]) {
    //     var definitions = [];

    //     for (let i = 0; i < data[12].length; i++) {
    //         let type = data[12][i][0];
    //         let content = [];

    //         for (let j = 0; j < data[12][i][1].length; j++) {
    //             let obj = {
    //                 phrase: data[12][i][1][j][0],
    //                 instance: data[12][i][1][j][2],
    //             };
    //             content.push(obj);
    //         }
    //         let section = {
    //             type,
    //             content,
    //         };
    //         definitions.push(section);
    //     }
    //     obj.definitions = definitions;
    // }

    // if (data[11]) {
    //     var synonyms = [];

    //     for (let i = 0; i < data[11].length; i++) {
    //         let type = data[11][i][0];
    //         let content = [];

    //         for (let j = 0; j < data[11][i][1].length; j++) {
    //             let arr = data[11][i][1][j][0];
    //             content.push(arr);
    //         }
    //         let section = {
    //             type,
    //             content,
    //         };
    //         synonyms.push(section);
    //     }
    //     obj.synonyms = synonyms;
    // }

    // if (data[13]) {
    //     var examples = [];
    //     for (let i = 0; i < data[13][0].length; i++) {
    //         examples.push(data[13][0][i][0]);
    //     }
    //     obj.examples = examples;
    // }

    // if (data[14]) {
    //     obj.seeAlso = data[14][0];
    // }

    return obj;
}

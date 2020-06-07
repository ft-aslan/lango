
import axios from "axios";
import qs from "qs";

export async function findSlangDefinition(text) {
    try {
        const url = "https://api.urbandictionary.com/v0/define";
        const data = {
            term: text
        };

        console.log(url + '?' + qs.stringify(data, { indices: false }));
        const res = await axios({
            method: 'get',
            url: url + '?' + qs.stringify(data, { indices: false })
        });
        return res.data.list;
    } catch (err) {
        console.error(err)
        return null
    }
}

import axios from "axios";
import qs from "qs";

export class SlangDefinitionRes {
    definition: string
    permalink: string
    defid: number
    author: string
    thumbs_up: number
    thumbs_down:number
    sound_urls: string[]
    word: string
    current_vote: string
    written_on: string
    example: string
}

export async function findSlangDefinition(text) : Promise<SlangDefinitionRes[]> {
    try {
        const url = "https://api.urbandictionary.com/v0/define";
        const data = {
            term: text
        };

        console.log(url + '?' + qs.stringify(data, { indices: false }));
        const res : SlangDefinitionRes[] = (await axios({
            method: 'get',
            url: url + '?' + qs.stringify(data, { indices: false })
        })).data.list;
        return res;
    } catch (err) {
        console.error(err)
        return null
    }
}
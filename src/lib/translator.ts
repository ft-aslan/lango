async function translateWords(e?: Event) {
    let value = e ? (e.target as HTMLInputElement).value : $targetWords;
    if (value != null && value.trim() != "") {
      let result = await translate(value.trim(), {
        from: translationFrom.code,
        to: translationTo.code,
      });

      let foundWord = $wordbook.find((w) => w.text == value);
      if (foundWord) {
        wordbook.increaseUsage(foundWord);
      }

      if (result) {
        if (
          result.hasOwnProperty("translations") ||
          result.hasOwnProperty("translation")
        ) {
          $currentTranslation = result;
        }
      }
    } else {
    }
  }
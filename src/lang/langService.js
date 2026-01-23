import fs from "fs";
import path from "path";

// Use process.cwd() for all environments to avoid import.meta.url issues
const localesPath = path.join(process.cwd(), 'src', 'lang', 'locales');

const getMessages = (lang = "en") => {
  try {
    const filePath = path.join(localesPath, `en.json`);
    const messages = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return messages;
  } catch (error) {
    console.error(
      `Language file '${lang}.json' not found, defaulting to English`
    );
    const defaultPath = path.join(localesPath, "en.json");
    return JSON.parse(fs.readFileSync(defaultPath, "utf8"));
  }
};

export default getMessages;

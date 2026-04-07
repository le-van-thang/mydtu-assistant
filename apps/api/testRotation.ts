import "dotenv/config";
import { generateTextWithRotation } from './src/utils/geminiClient';
async function test() {
  try {
    const res = await generateTextWithRotation({ model: 'gemini-1.5-flash', prompt: 'say hi' });
    console.log("SUCCESS:", res.text);
  } catch (e) {
    console.error("FAIL:", e);
  }
}
test();

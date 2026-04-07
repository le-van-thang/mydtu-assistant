const { createGoogleGenerativeAI } = require("@ai-sdk/google");
const { generateText } = require("ai");

const google = createGoogleGenerativeAI({
  apiKey: "AIzaSyDBqiOq_RxS9Ctelr2Da19BBtYIPzAjLcQ" // the first key
});

async function run() {
  try {
    const result = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: "Hello"
    });
    console.log("Success:", result.text);
  } catch (err) {
    console.error("ERROR 1.5:", err.message);
  }

  try {
    const result2 = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: "Hello"
    });
    console.log("Success:", result2.text);
  } catch (err) {
    console.error("ERROR 2.5:", err.message);
  }
}
run();

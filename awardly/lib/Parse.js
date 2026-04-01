import Parse from "parse"
Parse.initialize(
  process.env.NEXT_PUBLIC_PARSE_APP_ID,
  process.env.NEXT_PUBLIC_PARSE_JS_KEY
);

Parse.serverURL = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;

export default Parse;
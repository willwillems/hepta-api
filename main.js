import { initializeApp } from "https://cdn.skypack.dev/firebase/app"
import { getAuth, sendSignInLinkToEmail, signInWithEmailLink } from "https://cdn.skypack.dev/firebase/auth"

// Hepta Firebase config
const firebaseConfig = {
   apiKey: "AIzaSyCChCpgZZ4vfNoc_MkkaN_b7h3IsKkVxRE",
   authDomain: "project-meta-6138f.firebaseapp.com",
   projectId: "project-meta-6138f",
   storageBucket: "project-meta-6138f.appspot.com",
   messagingSenderId: "20580241631",
   appId: "1:20580241631:web:206d68f7c6488bcc17196a"
}

// Init firebase components
const firebaseApp = initializeApp(firebaseConfig)
const auth = getAuth(firebaseApp)

// send sign in link
const email = Deno.args[0]
const actionCodeSettings = {
   url: `https://signin.heptabase.com?email%3D${email}&lang=en`,
   handleCodeInApp: true
}
await sendSignInLinkToEmail(auth, email, actionCodeSettings)

// login
const emailLink = prompt("Enter the email link", null)
const { user } = await signInWithEmailLink(auth, email, emailLink)

// get token to communicate with backend
const idTokenResult = await user.getIdTokenResult()
const { token } = idTokenResult


// simple functions to communicate w. Hepta
const getDataUrl = "https://api.heptabase.com/v1/sync/get"
const getData = (idToken) => async () => {
   const response = await fetch(getDataUrl, {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json'
      },
      body: JSON.stringify({
         idToken
      })
   })
   if (response.status !== 200) throw new Error(await response.text())
   return await response.json()
}

const getHeadUrl = "https://api.heptabase.com/v1/sync/head"
const getHead = (idToken) => async () => {
   const response = await fetch(getHeadUrl, {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json'
      },
      body: JSON.stringify({
         idToken
      })
   })
   if (response.status !== 200) throw new Error(await response.text())
   return await response.json()
}

const setDataUrl = "https://api.heptabase.com/v1/sync/put"
const setData = (idToken) => async (data) => {
   const response = await fetch(setDataUrl, {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json'
      },
      body: JSON.stringify({
         idToken,
         ...data
      })
   })
   if (response.status !== 200) throw new Error(await response.text())
   return await response.json()
}

// get data and parse state
const data = await getData(token)()
const state = JSON.parse(data.body)

// compose whatever you want your new state to be 
const newState = {
   ...state,
   cardList: [
      ...state.cardList,
      {
         cardId: crypto.randomUUID(),
         whiteBoardIds: [],
         tags: [],
         title: "Web clipper test",
         content: `# Fetching local files

As of Deno 1.16, Deno supports fetching file: URLs. This makes it easier to write code that uses the same code path on a server as local, as well as easier to author code that work both under the Deno CLI and Deno Deploy.`,
         isDeleted: false,
         created_time: (new Date()).toISOString(),
         last_edited_time: (new Date()).toISOString()
      }
   ]
}

// get this thingy here
const Metadata = {
   ...(await getHead(token)()).Metadata,
   version: String((new Date()).getTime())
}
// compose body
const Body = JSON.stringify(newState)

// set data on server
const result = await setData(token)({ Body, Metadata })
// throw error if unexpected response
if (result.body !== '"success"') throw new Error("Unexpected success response")

// everything went ok!
Deno.exit(0)

#Issues:
##listCleanUp

###Goals
The goal is to have the user select a state from a dropdown list. Then, we'll need to use that choice to create a list of metro areas in that state. 


There are three functions that currently exist:

- cleanUp
- buildStateList
- parseCleanedList

So, what do they all do?

## 1. cleanUp: 
This function breaks the state abbreviations out of a text string and makes them a separate property of each metro object. 

This function contains a two-dimensional for loop. This loop takes something like this: 

> "Allentown, Bethlehem, Easton - PA, NJ" 

The first for loop breaks it at the at the hyphen. Eventually it changes this:

`
{
   msamd_name:"Aguadilla, Isabela - PR",
   msamd:"10380"
}
`

into this:

`
{ msamd:"10380"
msamd_name: "Aguadilla, Isabela"
states: ["PR"]
}
`

There can be multiple objects in the states array. 

So what does the next function need to do? Actually, I'm going to argue that it only needs to be called dynamically. So when the user selects a state, then we call a function that runs through every metro, checks to see if the metro is in that state, and then builds a metro dropdown list. 

##2. buildStateList


##3. state-race-loan-plotter
Q: Now I am seeing a thing. The first part of the app, that checks HMDA by state, has several long functions. One is hmdaQuery, which is about 200 lines of code. Another is buildScatterPlot, which is about 250 lines of code. 

Here's my first thought: Duplicating these functions with similar functions that build a metro-level scatterplot is not optimal. There must be a way to re-do and broaden these functions so that they can handle both tasks. 

Next up: Let's read both functions, understand them completely, and then begin to broaden them. 

One possible solution is to break the long functions up into smaller functions that are called within analyzeStateData() and analyzeMetroData(). 

##4. UX Architecture
I think I may be thinking about this all wrong. Does the user really want to chose between state and metro level analysis? Or does the user want to choose a state and then zoom in the metro area? 

Probably it's the latter that's the better option here. It's probably more flexible too ... because if you want to get out of metro area and look at the state level, you can just choose a different state. 

Might need some sort of "back" button, actually. 

The way this would work, narratively, is something like this: 

- The user loads the page the first time. The page runs cacheQueries_1(), and displays the loader. Just like in the old version. 
- Then it displays data for the first state. Can be Ala to begin with, but ultimately it'd be awesome if it went to the state where the user is located. 
- The page also generates a new button — like the race button — with a dropdown list for metro area. So the metroList dropdown by default selects "All cities," which gives you the option of looking at the whole state. This dropdown list is dynamically rendered based on the state choice. 

##5. Mini Diary

Monday, Dec 4: By the end of the day I had a working — if buggy — version of the metro-level data visualizer. I'm not sure it's that interesting, though! Most municipalities aren't that different than the states. We need to take this farther and look at some other aspects of the data. What about displaying the individual banks most likely to behave in certain ways?




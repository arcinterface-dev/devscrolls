# How to Create HTML Elements Dynamically and Bind Events with JavaScript

Today In this article is all about how to Create HTML Elements Dynamically and Bind Events with JavaScript.

There are different ways to Create an HTML Element with JavaScript and bind an event to it. You can use the createElement() method or you can use .innerHTML to create a new HTML element. To bind an event to HTML element that you created, you can use the addEventListener() method.


Let’s see How to Create HTML Elements Dynamically and Bind Events with JavaScript in detail.

Why create HTML element with JavaScript
If you are thinking why do we have to create an HTML element with Javascript where you can able to add it to the HTML document itself? That’s the question I had when I started developing web pages.

In traditional websites, we don’t use this approach much. If we want to show any new element or part of the section to the user then the page has to reload from the user end (browser reloads). It affects the user experience and interactivity.

Creating dynamic HTML elements with JavaScript is an essential tool for modern web development. It provides a powerful and flexible way to create dynamic, interactive, and performant web pages which help users to engage with the webpage.

Overview
Creating HTML Element with JavaScript
Ways to create an HTML element
The recommended way to create an HTML element
Creating a new element with createElement()
Setting attributes for the element
Appending the new element to the targeted parent element
Binding Events to HTML Element
Bind events with addEventListener()
Other event types
Creating a function to handle the event
Complete Code Sample
Codepen Example
Creating HTML Element with JavaScript
Ways to create an HTML element
There are different ways to create HTML elements using JavaScript including:

Using the document.createElement() method:
const newElement = document.createElement('div');
document.querySelector('body').appendChild(newElement);
Using the innerHTML property to create an element and set its content:
document.querySelector('body').innerHTML = `<h1>Hello World!</h1>`
Using the insertAdjacentHTML() method to insert a new element into the DOM:
const parentElement = document.getElementById('parent');
parentElement.insertAdjacentHTML('beforeend', '<div>Hello, World!</div>');
Using the document.write() method to write HTML directly to the document:
document.write('<div>Hello, World!</div>');
The recommended way to create an HTML element
The recommended way for creating HTML elements using JavaScript depends on the specific use case and the context in which the elements will be used. However, In general, the most recommended way is to use the document.createElement() method or the insertAdjacentHTML() method.

The document.createElement() method is useful when you need to create a new element from scratch and set the necessary attribute and content using JavaScript. This method provides more control over the structure and behavior of the elements.

Discover more
Programming
Web Design
Email & Messaging
The insertAdjacentHTML() method is useful when you need to insert a new element into the DOM quickly and easily. This method allows you to insert HTML strings into the document at a specific position relative to existing elements, which is more convenient than creating elements from scratch.

However, In this article, we are creating elements using document.createElement() method.

Creating a new element with createElement()
The document.createElement() method creates the HTML element specified by tagName or an HTMLUnknownElement if tagName isn’t recognized.

Syntax:

createElement(tagName);
createElement(tagName, options);
Parameters:

tagName – A string that is used to specify what type of HTML element needs to create. eg: div, p, a, span, etc.

options – it will be used in case the element is created based on a custom element. See Web component example for more details.

Example:
The following example shows how to create a div element and assign it to a variable named ‘boxEl’

const boxEl = document.createElement('div');
Setting attributes for the element
The setAttribute() method sets the value of an attribute on the specified element. If the attribute already exists, then the value is updated otherwise a new attribute is added to that element.

To get the current value of an attribute, use getAttribute(attributeName).

Discover more
Programming
Email & Messaging
Web Design & Development
To remove an attribute, use removeAttribute(attributeName).

Syntax:

setAttribute(name, value);
Parameters:

name – A name of the HTML attribute. eg name, id, class, tabindex, disabled, etc.

value – The value to assign to the attribute for the HTML element.

Example:
The following example shows how to add an attribute id for the previously created ‘boxEl’ element.

const boxEl = document.createElement('div');
boxEl.setAttribute('id', 'box');
Appending the new element to the targeted parent element
The appendChild() method is used to add a created HTML element or node to the end of the list of children of a specified parent node.

Example:
The following example shows how to add the previously create HTML element ‘boxEl’ to the DOM.

const boxEl = document.createElement('div');
boxEl.setAttribute('id', 'box');
// body tag is the parent node in this case,
// the boxEl add inside the body tag.
const parentEl = document.querySelector('body');
parentEl.appendChild(boxEl);
Live Example
See the Codepen example here for your better understanding with some styling. In this example, the HTML element is created when the page loads for the first time.

See the Pen Untitled by Santhanakrishnan (@Santhanakrishnan) on CodePen.

Binding Events to HTML Element
Bind events with addEventListener()
The addEventListener() method allows us to bind events along with the function called whenever the specified event triggers the element.

Syntax:

addEventListener(type, listener);
addEventListener(type, listener, useCapture);
Parameters:

type – A type is used to specify the type of event that triggers. Like click, dbclick, mouseover, etc.

listener – A JavaScript function that calls whenever the specified event type triggers.

Discover more
web design
Computers & Electronics
Web Design
useCapture – A boolean value specifying whether to use event bubbling or event capturing. This parameter is optional.

Example:
The following example shows how to bind a click event for the HTML element ‘boxEl’ which we created earlier.

boxEl.addEventListener('click', handleClick);
Other Event Types
You can add a different event type to the same HTML element or any other element.

Examples:
boxEl.addEventListener("click", myFunction);
boxEl.addEventListener("mouseover", mySecondFunction);
boxEl.addEventListener("mouseout", myThirdFunction);
Creating a function to handle the event
In the previous example, we bind an event click along with the listener handleClick which is nothing but a function name. Whenever the event triggers on the specified element the function handleClick will execute. It passed event object as an argument which contains all the event-related details like targeted element, event type, etc.

function handleClick(event) {
  // code to perform after click event happens.
}
Complete Code Sample
See the Codepen example here for your better understanding with some styling.

In this example, the HTML element is created when the page loads for the first time, and the new HTML element will be created whenever the user clicks the box and the color of the box will change while the user hovering the box.
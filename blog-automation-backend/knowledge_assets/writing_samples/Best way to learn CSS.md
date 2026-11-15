# Best way to learn CSS

If you are new to web design/development or you are an intermediate level who wants to become a master in CSS then this article is for you.

1. Layouts
The layout is the heart of a website, It helps us to place things where we wanted. If you don’t know how to structure the HTML and CSS layout then it causes you a lot more time than you think!

In today’s web development world, we have more efficient ways to structure our web page layout with the help of CSS Flexbox & Grid layout.


Both flexbox and grid layout are very useful and efficient ways to structure our web page across different screen sizes which could save a lot of time working on responsive designs.

You can learn both these layouts from one of the best articles,

A Complete Guide to Flexbox by CSS Tricks

A Complete Guide to Grid by CSS Tricks

2. Positioning Elements
Once we are good at layouts, The second most important task is positioning the elements or UI components.

Positioning things like floating buttons at the corner of a page (for example having a contact form or go to top button), sticky headers, and sticky social icons these are all come under CSS positioning.


To achieve this we should have a clear understanding of CSS position properties which have different types like a static, absolute, relative, fixed, or sticky.

Position property allows us to use some other property as well which is not working for any elements which have the “position: static” type. (NOTE: all the elements by default static position only)

With position property, we can you other properties like a top , left , bottom , and right to move our HTML element from one position to another.

It allows us to use one more property which is the z-index which helps to re-arrange our HTML elements in stack order (move one element from foreground to background and vice versa ). the z-index will not work on type static.

To learn more about position property: https://css-tricks.com/almanac/properties/p/position/

3. Media Queries
CSS media queries are used to design web pages based on the specific device type such as print or screen.

Print media: The styles which are written inside the print media will only have an effect while they print the page. In other words, we can use this print media query if we want to add or remove some CSS while printing the page.

<code>
    @media print {
       /* … */
    }
</code>
Screen media: If we want to design a web page based on the screen size like iPad or Mobile devices then the screen media query is very useful.

In some cases,

We don’t want the desktop home page banner image on our mobile screen,
The navigation menu should be hidden on the mobile device until the user clicks on the hamburger menu to show up.
Changing the desktop horizontal sections layout to vertical layout on mobile devices, etc.
<code>
    @media screen {
       /* … */
    }

    @media (max-width: 767px) {
      /* media that works only screen size upto 767px eg: mobile device */
    }
</code>
4. Utilize Pseudo Elements/Classes
CSS Pseudo-elements and pseudo-classes are used to serve a specific purpose in a webpage along with an HTML element like,

To style the first letter or first line of an element,
To insert content before or after the HTML element.
Pseudo-elements/classes are the best in their very own ways, if you utilize them correctly we can save lots of resources.

<code>
   // used to style or add before or after content like ::before, ::after
    selector::pseudo-element { 
       property: value;
    }

   // used to define state of an element like :hover, :active, :disabled
    selector:pseudo-class {   
       property: value;   
    }
</code>
5. Micro Animations
One of the best ways to enhance user experience is to give the user feedback on every action they made on our web page, like showing some animations while clicking the button, submitting the form, hovering some elements, etc.

The below gif image is one example of micro animation when the user clicks the button and immediately sends feedback to the user that the button was clicked!
# Make div to fill the empty space using CSS

Let’s see some use case and different approaches to Make div to fill the empty space using CSS!

Case 1: Footer in the middle of the page
In some cases our webpages like 404 page, contact page or other pages which has minimum amount of info which is not enough to make our footer section at the end of visible area on the screen. In that case we want our footer section to be last.

Let’s see this below example:

footer-in-middle
As you can see the footer is not at the bottom of the page and it’s look kinda middle of the page
Anyway, In this case we don’t want a footer to be in the middle right? here’s what you can do

Solution: Fill the empty space – CSS only
If you the Header & Footer height and it will always be static (not changing at some point) then you can fix this issue with CSS alone.

Let’s say you header height is 200px and footer height is 100px then you have to sum the both the heights and subtract with the visible height area of the <body> height.

vh – is nothing but viewport height or visible area height

100vh means 100% of viewport height, we have to subtract with the header & footer heights.

   main {
     min-height: calc(100vh - 300px);
   }
Let’s see after this CSS is applied.

fill-empty-space
Ahaa! that’s what am taking about…
Example:
See the Pen theDailyFrontend – Occupy remaining space CSS only – calc() by Santhanakrishnan (@Santhanakrishnan) on CodePen.

Case 2: Auto-sized content using flexbox
We can use the flexbox property to make an element fill the remaining spaces horizontally or vertically.

auto-sized-flexbox
In the above image you can see that there is an empty space after the last box. with flex layout you can able to accommodate that space with flex property.

Solution: flex auto
In order to use flex for that last box your wrapper element should use the flex layout.

    .main-content {
        display: flex;
        flex-wrap: wrap;
    }
    /** setting the last box size as flex auto */
    .main-content .box:last-child {
        flex: auto;
    }
flex-auto-img
Example:
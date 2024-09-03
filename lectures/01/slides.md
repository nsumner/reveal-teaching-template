# Lecture Title
### CMPT XXX: Course Name
### Instructor <br> email @ sfu.ca

---
## Lists elements fade in with highlights

* **Emphasized** item 1
* Some code examples
  * If you have [Fira Code](https://github.com/tonsky/FiraCode) installed, code examples will have readability ligatures enabled.
  * Some neutral code
      ```C []
      if (a != b) {
        foo(c);
      }
      ```
  * Some bad code with highlighted lines <!-- .element: class="bad" -->
      ```C [1|2|1-2]
      if (a != b) {
        foo(c);
      }
      ```
* Try out the printing link on the title page, too

---
## Annotations can fine-tune behavior

* Good code <!-- .element: class="good" -->
    ```C []
    if (a != b) {
      foo(c);
    }
    ```
* Bad code  <!-- .element: class="bad" -->
    ```C []
    if (a != b) {
      foo(c);
    }
    ```
* A list of elements displayed all at once
  - All <!-- .element: class="blocklist" -->
  - at
  - once
* And this will still fade in afterward.

---
## Annotations can fine-tune behavior (2)

* Transient elements will disappear even after fading in: <br>
  ![Image not available](https://coursys.sfu.ca/static/newsfu/bg-small.png "Hover text for info") <!-- .element: class="transient" -->
* Reference lists are just tagged lists of links:
  * [Ousterhout 2018](https://web.stanford.edu/~ouster/cgi-bin/aposd.php) <!-- .element: class="reference-list" -->
  * [Hickey 2011](https://www.infoq.com/presentations/Simple-Made-Easy/)
* Elements tagged with no-print do not show up when printing to a PDF. <!-- .element: class="no-print" -->

---
## Overnotes in HTML

Basic divs and spans can be used for "pop over" content windows that may display relevant messages.
They disappear afterward and consume no space.

* This is fake content
* that simulates
* some real content
* You can use an overnote
    <div class="overnote">
    within other content.<br>

    <ul>
      <li>It could also
      <li>contain a list or other content.
    </ul>
    </div>
* Or
    <div class="overnote-inline">
    They can also be used "inline" within the flow of the text.
    </div>
* Where the content resumes afterward.

<div class="overnote-bottom">
They can also be anchored to the bottom.
</div>

---
## Scriptable Animations

SVG figures can be animated with inline commands in markdown.<br>
This includes generated SVG figures from, e.g., Mermaid.

![External SVGs will be inlined](external.svg "External SVGs will be inlined.")

```animate-svg
1. show(first)
2. show(second)
3. show(third)
4. hide(second)
```

---
## Other Reveal.js features still work

* Including embedded SVG and animations. <!-- .element: data-fragment-index="1" -->
    <br>
    <svg width="500" height="100" viewBox="0 0 500 100" xmlns="http://www.w3.org/2000/svg">
      <g class="fragment fade-in" data-fragment-index="2">
        <rect width="200" height="35" x="40" y="10" stroke="#000" fill="#fff"/>
        <text font-size="24" y="35" x="42">Thing 1</text>
      </g>
      <g class="fragment fade-in" data-fragment-index="3">
        <rect width="200" height="35" x="90" y="45" stroke="#000" fill="#fff"/>
        <text font-size="24" y="70" x="92">Thing 2</text>
      </g>
    </svg>
* display order   <!-- .element: data-fragment-index="5" -->
* And controlling <!-- .element: data-fragment-index="4" -->
* Showing web pages <!-- .element: data-fragment-index="6" -->
    <iframe data-src="https://revealjs.com/" data-preload
        class="fragment fade-in-then-out website" data-fragment-index="7"></iframe>

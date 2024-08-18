# Reveal.js Teaching Template

This template provides basic tools that make it easier to write lectures in
markdown and produce pleasant lectures as web pages in reveal.js.

This template contains
1) a base distribution of [reveal.js](https://revealjs.com/)
2) a style theme that I find more pleasant and useful for teaching
3) a plugin that makes it easier to write lectures in markdown
   while leveraging reveal.js and the teaching theme


## Deploying

### Building and Running Interactively

Lectures can be served from a local webserver that reloads presentations on
changes. This both makes things easier to edit and better complies with some
security standards that hinder viewing local files directly in a browser.
By default viewing presentations locally will produce a CORS error
unless viewed through the server.

After cloning the repo, the original reveal.js instructions work to start the
web server and provide you a URL to access in a browser to view the
presentation:

    cd <repo directory>
    npm install
    npm start

After this, the displayed URL can be used to access the presentation
(most likely <http://localhost:8000>).


### Uploading the Static Files

If you want to deploy the presentation on an existing server, then you
need to copy the relevant files from the repository after building.
Simply uploading the entire repository will suffice but is unnecessary.
The core components are:

* `index.html`
* `dist/`
* `plugin/`
* `lectures/`

If you have `gulp` installed, you can produce a `.zip` file containing
everything by running:

    gulp package


## Creating Lecture Content

All lecture files are stored in the `lectures/` directory of the repo, with
each individual lecture stored inside a separate subdirectory. The directory
for a single lecture will contain (1) a `slides.html` page that serves the
lecture, (2) a `slides.md` markdown file that determines the lecture content,
and (3) any media for the lecture that are referenced by the markdown file.

To add a new lecture, you can
1) copy an existing lecture directory, e.g. `lectures/01/`,
    to a new directory, e.g. `lectures/02/`.
2) add a link to the new lecture page inside `index.html`.
3) modify the new `slides.md` inside the directory you created to contain
    your desired lecture content following the existing examples.


## Modifying Styles

All styling is managed by CSS controlled by the teaching theme in
`css/theme/source/teaching.scss`. You can add new styles as you see fit.
Some of the existing styles are required for the components of the template
to operate.



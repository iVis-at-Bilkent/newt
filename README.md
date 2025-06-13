# Newt: A Sample Application for ChiSE

Newt is a sample application for the web based library named [ChiSE](https://github.com/iVis-at-Bilkent/chise.js) developed to visualize and edit the pathway models represented by process description (PD) and activity flow (AF) languages of [SBGN](http://sbgn.org), [SBML](https://sbml.org/) or [simple interaction format (SIF)](https://www.pathwaycommons.org/pc/sif_interaction_rules.do).

ChiSE and this sample application are distributed under [GNU Lesser General Public License](http://www.gnu.org/licenses/lgpl.html).

### How to Cite Usage

Please cite the following when you use Newt:

H. Balci, M.C. Siper, N. Saleh, I. Safarli, L. Roy, M. Kilicarslan, R. Ozaydin, A. Mazein, C. Auffray, O. Babur, E. Demir and U. Dogrusoz, [Newt: a comprehensive web-based tool for viewing,constructing, and analyzing biological maps](https://doi.org/10.1093/bioinformatics/btaa850), **Bioinformatics**, 37(10), pp.1475-1477, 2021.

## Software

**A deployment of this sample application along with detailed documentation on its usage** can be found [here](http://newteditor.org/). ChiSE and Newt work on every platform that have JavaScript support including mobile devices.

#### Running a Local Instance
In order to deploy and run a local instance of the tool, please follow the steps below (we recommend the use of version 14.19.3 of node.js):

- Local Neo4j Database
If you want to use the local instance of Newt with a local Neo4j database, then follow these additional steps **before** running `npm install`:
1. **Create a `.env` file** in the root of the project directory with the following content
```
LOCAL_DATABASE=true
NEO4J_PLUGIN_PATH=/path/to/your/neo4j/plugins
```
> Replace the `NEO4J_PLUGIN_PATH` value with the absolute path of your neo4j database plugin folder.

- Installation
```
git clone https://github.com/iVis-at-Bilkent/newt.git
cd newt
npm install 
```

- Running the tool (Windows)
```
npm run debug-build
```
- Running the tool (MacOS/Linux)
```
sudo npm run debug-build
```

Then, open a web browser and navigate to localhost. Please note that the default port is 80 but you might have to run this application in another port such as 8080 in some platforms by setting 'port' environment variable.

## Credits

Icons made by [Freepik](http://www.freepik.com), 
[Daniel Bruce](http://www.flaticon.com/authors/daniel-bruce), 
[TutsPlus](http://www.flaticon.com/authors/tutsplus),
[Robin Kylander](http://www.flaticon.com/authors/robin-kylander),
[Catalin Fertu](http://www.flaticon.com/authors/catalin-fertu),
[Yannick](http://www.flaticon.com/authors/yannick),
[Icon Works](http://www.flaticon.com/authors/icon-works),
[Flaticon](http://www.flaticon.com) and licensed with 
[Creative Commons BY 3.0](http://creativecommons.org/licenses/by/3.0/)

Third-party libraries:
[Cytoscape.js](https://github.com/cytoscape/cytoscape.js),
[a-color-picker](https://www.npmjs.com/package/a-color-picker),
[Backbone](https://github.com/jashkenas/backbone),
[Bootstrap](https://github.com/twbs/bootstrap),
[FileSaver.js](https://github.com/eligrey/FileSaver.js),
[jQuery](https://github.com/jquery/jquery),
[jquery-expander](https://github.com/kswedberg/jquery-expander),
[Konva](https://github.com/konvajs/konva),
[libxmljs](https://github.com/libxmljs/libxmljs),
[lodash](https://github.com/lodash/lodash),
[underscore](https://github.com/jashkenas/underscore),
[express](https://github.com/expressjs/express),
[browserify](https://github.com/browserify/browserify),
[nodemon](https://github.com/remy/nodemon),
[Parallel Shell](https://github.com/darkguy2008/parallelshell),
[Tippyjs](https://github.com/atomiks/tippyjs),
[nodemailer](https://nodemailer.com/about/),
[body-parser](https://github.com/expressjs/body-parser),
[jsdom](https://github.com/jsdom/jsdom),
[cypress](https://github.com/cypress-io/cypress),
[multer](https://github.com/expressjs/multer) licensed with [MIT](https://opensource.org/licenses/MIT);
[Mousetrap](https://github.com/ccampbell/mousetrap),
[Request](https://github.com/request/request) licensed with [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0),
[Intro.js](https://github.com/usablica/intro.js) licensed with [GNU AGPL](https://www.gnu.org/licenses/agpl-3.0.en.html), and
[chroma-js](https://github.com/gka/chroma.js) licensed with [this](https://github.com/gka/chroma.js/blob/master/LICENSE).

We refer the user to [GeneCards](https://www.genecards.org/) for detailed properties of genes. Similarly, we pull properties of simple chemicals from [ChEBI](https://www.ebi.ac.uk/chebi/). CellDesigner conversion is performed through [this library](https://github.com/royludo/cd2sbgnml ) and [its associated service](https://github.com/iVis-at-Bilkent/cd2sbgnml-webservice). Finally, SBML and GPML conversions are due to [this Minerva service](https://minerva-dev.lcsb.uni.lu/minerva/api/convert/).

## Team

  * [Hasan Balci](https://github.com/hasanbalci), [Selbi Ereshova](https://github.com/SelbiEreshova), [Umut Utku Ersahince](https://github.com/umut-er), [Noor Muhammad](https://github.com/NoorMuhammad1) and [Ugur Dogrusoz](https://github.com/ugurdogrusoz) of [i-Vis at Bilkent University](http://www.cs.bilkent.edu.tr/~ivis), [Ozgun Babur](https://github.com/ozgunbabur) of University of Massachusetts at Boston, and [Emek Demir](https://github.com/emekdemir) of the Demir Lab at [OHSU](http://www.ohsu.edu/)

#### Alumni

  * [Metin Can Siper](https://github.com/metincansiper), [Muhammed Salih Altun](https://github.com/msalihaltun), [Nasim Saleh](https://github.com/nasimsaleh), [Merve Kilicarslan](https://github.com/mervekilicarslan5), [Rumeysa Ozaydin](https://github.com/rumeysaozaydin), [Ilkin Safarli](https://github.com/kinimesi), [Ahmet Candiroglu](https://github.com/ahmetcandiroglu), [Kaan Sancak](https://github.com/kaansancak), [Ludovic Roy](https://github.com/royludo), [Leonard Dervishi](https://github.com/leonarddrv), [Istemi Bahceci](https://github.com/istemi-bahceci), [Alper Karacelik](https://github.com/alperkaracelik), [Alexander Mazein](https://github.com/amazein)

# A Sample Application for ChiSE

This is a sample application for the [web based library named ChiSE](https://github.com/iVis-at-Bilkent/chise.js) developed to visualize and edit the pathway models represented by process description maps in SBGN.

## Software

ChiSE and this sample application are distributed under [GNU Lesser General Public License](http://www.gnu.org/licenses/lgpl.html).

**A deployment of this sample application** can be found [here](http://cs.bilkent.edu.tr/~ivis/ChiSE_sample_app/). ChiSE works on every platform that have Javascript support including mobile devices.

Please cite the following when you use SBGNViz.js:

M. Sari, I. Bahceci, U. Dogrusoz, S.O. Sumer, B.A. Aksoy, O. Babur, E. Demir, "[SBGNViz: a tool for visualization and complexity management of SBGN process description maps](http://journals.plos.org/plosone/article?id=10.1371/journal.pone.0128985)", PLoS ONE, 10(6), e0128985, 2015.

#### Running a Local Instance
In order to deploy and run a local instance of the tool, please follow the steps below:

- Installation
```
git clone https://github.com/iVis-at-Bilkent/chise.js-sample-app.git
cd chise.js-sample-app
npm install 
```

- Running the tool
```
npm run debug-build
```

Then, open a web browser and navigate to localhost. Please note that the default port is 80 but you can run this application in another port by setting 'port' environment variable.

## Highlights

Below are some sample screenshots from ChiSE.js sample application, illustrating some of its capabilities. Please click on a figure to see it in full size. 

<table border="1" align="left">
	<tr>
		<td>
			<a href="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/mapk-cascade.png">
				<img src="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/mapk-cascade-s.png"/>
			</a>
                        <p align="center"> <b> Mapk cascade pathway visualized in SBGNViz.js </b> </p>
		</td>
		<td>     	
			<a href="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/highlight-processes.png">
				<img src="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/highlight-processes-s.png"/>
			</a>
                        <p align="center"> <b> Highlighting processes of selected node group </b> </p>
		</td>
	</tr>
	<tr>
		<td>
			<a href="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/hide-selected.png">
				<img src="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/hide-selected-s.png"/>
			</a>
                        <p align="center"> <b> Hiding selected node group </b> </p>
		</td>
		<td>     	
			<a href="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/after-hide-selected.png">
				<img src="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/after-hide-selected-s.png"/>
			</a>
                        <p align="center"> <b> Same graph after applying hiding on selected node group </b> </p>
		</td>
	</tr>
	<tr>
		<td>
			<a href="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/show-selected.png">
				<img src="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/show-selected-s.png"/>
			</a>
                        <p align="center"> <b> Showing only selected node group </b> </p>
		</td>
		<td>     	
			<a href="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/after-show-selected.png">
				<img src="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/after-show-selected-s.png"/>
			</a>
                        <p align="center"> <b> Same graph after showing only selected node group </b> </p>
		</td>
	</tr>
	<tr>
		<td>			
            <a href="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/highlight-neighbors.png">
				<img src="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/highlight-neighbors-s.png"/>
			</a>
			<p align="center"><b> Highlighting neighbors of selected node group </b></p>		
		</td>
		<td>			
			<a href="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/before-load.png">
				<img src="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/before-load-s.png"/>
			</a>
			<p align="center"><b> Load SBGN-PD diagram from an sbgn-ml file </b></p>	
		</td>
	</tr>
	<tr>
		<td>			
              <a href="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/load.png">
				<img src="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/load-s.png"/>
		      </a>
                      <p align="center"> <b> Loading an sbgnml file from file explorer </b>  </p>
		</td>
		<td>
			<a href="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/after-load.png">
				<img src="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/after-load-s.png"/>
			</a>
            <p align="center"> <b> SBGN diagram visualization of Glycolysis after loading its sbgnml file </b>  </p>
		</td>
	</tr>
	<tr>
		<td>
            <a href="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/save.png">
				<img src="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/save-s.png"/>
			</a>
            <p align="center"> <b> Saving current SBGN process description diagram as an sbgnml file </b>  </p>
		</td>
		<td>
			<a href="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/save-png.png">
				<img src="http://cs.bilkent.edu.tr/~ivis/sbgnviz-js/samples/save-png-s.png"/>
			</a>
            <p align="center"> <b> Saving current SBGN process description diagram as a png file  </b>  </p>
		</td>
	</tr>
</table>

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

Thanks to JetBrains for an [Open Source License](https://www.jetbrains.com/buy/opensource/)

## Team

  * [Metin Can Siper](https://github.com/metincansiper), [Selim Firat Yilmaz](https://github.com/mrsfy), [Ugur Dogrusoz](https://github.com/ugurdogrusoz), and [Alper Karacelik](https://github.com/alperkaracelik) of [i-Vis at Bilkent University](http://www.cs.bilkent.edu.tr/~ivis)

#### Alumni

  * Istemi Bahceci, Mecit Sari, Ayhun Tekat, M.Furkan Sahin

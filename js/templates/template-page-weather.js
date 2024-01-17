function initHTMLpageWeather () {
	d20plus.html = d20plus.html || {};

	d20plus.html.pageSettingsWeather = `
	<div class='weather tab-pane'>
		<div class="pagedetails">
			<strong style="display: block; margin-bottom: 10px;">
				<a class="tipsy-w showtip pictos" title="Requires all players to use a betteR20 script">!</a>
				Requires all players to use a betteR20 script
			</strong>
			<hr>
			<div class="pagedetails__header">
				<h3 class="page_title">Weather Type</h3>
			</div>
			<div class="pagedetails__subheader">
				<h4>Select type</h4>
			</div>
			<div>
				<label class="sr-only">select the weather type</label>
				<select name="weatherType1">
					<option>None</option>
					<option>Fog</option>
					<option>Rain</option>
					<option>Ripples</option>
					<option>Snow</option>
					<option>Waves</option>
					<option>Blood Rain</option>
					<option>Custom (see below)</option>
				</select>
			</div>
			<div class="pagedetails__subheader">
				<h4>Custom type</h4>
				<a class="tipsy-w showtip pictos" original-title="Input URL to your PNG when &quot;Custom&quot; is selected above. Broken URLs will appear as rain.">?</a>
			</div>
			<div>
				<label class="sr-only">input custom image</label>
				<input class="page-input" name="weatherTypeCustom1" placeholder="https://example.com/pic.png">
			</div>
			<hr>
			<div class="pagedetails__header">
				<h3 class="page_title">Amimation</h3>
			</div>
			<div class="pagedetails__subheader">
				<h4>Weather Direction</h4>
			</div>
			<div>
				<label class="sr-only">select the weather direction</label>
				<select name="weatherDir1">
					<option value="Northerly">Northerly</option>
					<option value="North-Easterly">North-Easterly</option>
					<option value="Easterly">Easterly</option>
					<option value="South-Easterly">South-Easterly</option>
					<option value="Southerly">Southerly</option>
					<option value="South-Westerly">South-Westerly</option>
					<option value="Westerly">Westerly</option>
					<option value="North-Westerly">North-Westerly</option>
					<option value="Custom (see below)">Custom (see below)</option>
				</select>
			</div>
			<div class="pagedetails__subheader">
				<h4>Custom Direction</h4>
				<a class="tipsy-w showtip pictos" original-title="Set direction when &quot;Custom&quot; is selected above">?</a>
			</div>
			<div class="row">
				<div class="col-xs-9">
					<input type="range" name="weatherDirCustom1" min="0" max="360" step="1">
				</div>
				<div class="col-xs-1">
					<input class="page-input page-hint weatherDirCustom1" disabled="" type="text">
				</div>
			</div>
			<div class="pagedetails__subheader">
				<h4>Weather Speed</h4>
			</div>
			<div class="row">
				<div class="col-xs-9">
					<input type="range" name="weatherSpeed1" min="0.01" max="1" step="0.01">
				</div>
				<div class="col-xs-1">
					<input class="page-input page-hint weatherSpeed1" disabled="" type="text">
				</div>
			</div>
			<div class="row pagedetails__subheader">
				<div class="col-xs-7 pagedetails__header">
					<h4 class="page_title">Oscillate</h4>
				</div>
				<div class="col-xs-7 pagedetails__header">
					<span>Periodically revert Weather direction, with frequency based on Threshold</span>
				</div>
				<div class="col-xs-3">
					<label class="switch">
						<label class="sr-only" for="page-oscillate-toggle">toggle oscillate</label>
						<input name="weatherOscillate1" id="page-oscillate-toggle" type="checkbox">
						<span class="slider round">
						</span></label>
				</div>
			</div>
			<div class="pagedetails__subheader">
				<h4>Oscillation Threshold</h4>
			</div>
			<div class="row">
				<div class="col-xs-9">
					<input type="range" name="weatherOscillateThreshold1" min="0.05" max="1" step="0.01" />
				</div>
				<div class="col-xs-1">
					<input class="page-input page-hint weatherOscillateThreshold1" disabled="" type="text" />
				</div>
			</div>
			<hr>
			<div class="pagedetails__header">
				<h3 class="page_title">Appearance</h3>
			</div>
			<div class="pagedetails__subheader">
				<h4>Weather Opacity</h4>
			</div>
			<div class="row">
				<div class="col-xs-9">
					<input type="range" name="weatherOpacity1" min="0.05" max="1" step="0.01" />
				</div>
				<div class="col-xs-1">
					<input class="page-input page-hint weatherOpacity1" disabled="" type="text" />
				</div>
			</div>
			<div class="pagedetails__subheader">
				<h4>Weather Intensity</h4>
			</div>
			<div>
				<label class="sr-only">select the weather intensity</label>
				<select name="weatherIntensity1">
					<option>Normal</option>
					<option>Heavy</option>
				</select>
			</div>
			<div class="row pagedetails__subheader">
				<div class="col-xs-7 pagedetails__header">
					<h4 class="page_title">Enable Tint</h4>
				</div>
				<div class="col-xs-7 pagedetails__header">
					<span>Adds semi-transparent color overlay to the whole page</span>
				</div>
				<div class="col-xs-3">
					<label class="switch">
						<label class="sr-only" for="page-oscillate-toggle">toggle tint</label>
						<input name="weatherTint1" id="page-oscillate-toggle" type="checkbox">
						<span class="slider round">
						</span></label>
				</div>
			</div>
			<div class="row pagedetails__subheader">
				<div class="col-xs-7 pagedetails__header">
					<h4>Tint Color</h4>
				</div>
				<div class="col-xs-3">
					<input type="color" name="weatherTintColor1">
				</div>
			</div>
			<div class="pagedetails__subheader">
				<h4>Tint Opacity</h4>
			</div>
			<div class="row">
				<div class="col-xs-9">
					<input type="range" name="weatherTintOpacity1" min="0.1" max="1" step="0.01" />
				</div>
				<div class="col-xs-1">
					<input class="page-input page-hint weatherTintOpacity1" disabled="" type="text" />
				</div>
			</div>
			<div class="pagedetails__subheader">
				<h4 class="page_title">Special Effects</h4>
			</div>
			<div>
				<label class="sr-only">select effects</label>
				<select name="weatherEffect1">
					<option>None</option>
					<option>Lightning</option>
				</select>
			</div>
		</div>
	</div>
	`;
}

SCRIPT_EXTENSIONS.push(initHTMLpageWeather);

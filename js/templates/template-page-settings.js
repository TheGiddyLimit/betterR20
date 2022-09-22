function initTemplatePageSettings () {
	// no mods; just switched in to grant full features to non-pro
	const templatePageSettings = `<script id='tmpl_pagesettings' type='text/html'>
    <ul class='nav nav-tabs pagedetails_navigation'>
        <li class='active'>
            <a data-tab='pagedetails' href='javascript:void(0);'>
                <h2>Page Details</h2>
            </a>
        </li>
        <li class='nav-tabs--beta'>
<span class='label label-info'>
Updated
</span>
            <a data-tab='lighting' href='javascript:void(0);'>
                <h2>Dynamic Lighting</h2>
            </a>
        </li>
        <li class='nav-tabs'>
            <a data-tab='legacy-lighting' href='javascript:void(0);'>
                <h2>Legacy Lighting</h2>
            </a>
        </li>
    </ul>
    <div class='tab-content'>
        <div class='legacy-lighting tab-pane'>
			<!-- BEGIN MOD -->
			<strong style="display: block; margin-bottom: 10px;"><i>Requires a paid subscription or all players to use a betteR20 script</i></strong>
			<hr>
			<!-- END MOD -->
            <div class='lighting_feature showtip' data-feature_enabled='showdarkness' id='fog_settings' title='Enabling Fog of War will disable Updated Dynamic Lighting'>
                <label class='feature_name'>
                    <strong>Fog of War</strong>
                </label>
                <div class='feature_options'>
                    <input class='darknessenabled feature_enabled' type='checkbox' value='1'>
                    <label class='checkbox'>&nbsp; Enabled</label>
                </div>
            </div>
            <hr>
            <div class='lighting_feature' data-feature_enabled='adv_fow_enabled' id='afow_settings'>
                <label class='feature_name'>
                    <strong>Advanced Fog of War</strong>
                </label>
                <div class='feature_options'>
                    <input class='advancedfowenabled feature_enabled showtip' type='checkbox' value='1'>
                    <label class='checkbox'>&nbsp; Enabled</label>
                    <div class='subsettings'>
                        <div>
                            <input class='advancedfowshowgrid showtip' title='By default the Advanced Fog of War hides the map grid anywhere revealed but the player can no longer see because of Dynamic Lighting. This option makes the grid always visible.' type='checkbox' value='1'>
                            <label class='checkbox'>&nbsp; Show Grid</label>
                        </div>
                        <div>
                            <input class='dimlightreveals showtip' title='By default the Advanced Fog of War will not be permanently revealed by Dynamic Lighting that is not bright. This option allows dim lighting to also reveal the fog.' type='checkbox' value='1'>
                            <label class='checkbox'>&nbsp; Dim Light Reveals</label>
                        </div>
                        <div>
                            <input class='showtip' id='afow_gm_see_all' title='By default, Advanced Fog of War is only revealed by tokens with sight that are controlled by at least one player.&lt;br&gt;This option allows tokens with sight which are not controlled by anyone to reveal Advanced Fog of War for the GM only.' type='checkbox' value='0'>
                            <label class='checkbox'>&nbsp; All Tokens Reveal (GM)</label>
                        </div>
                        <div id='afow_grid_size' style='width: 180px; line-height: 30px;'>
                            <span id='cell_measurement'>Cell Width:</span>
                            <input type="number" class="advancedfowgridsize units" value="<$!this.model.get("adv_fow_grid_size")$>" />
                            <br>
                            <span>x 70 px =</span>
                            <input type="number" class="px_advancedfowgridsize pixels" value="<$!this.model.get("adv_fow_grid_size")*70$>" />
                            <span>px<sup>*</sup></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class='lighting_feature' data-feature_enabled='showlighting' id='dynamic_lighting_settings'>
                <label class='feature_name'>
                    <strong>Dynamic Lighting</strong>
                </label>
                <div class='feature_options'>
                    <input class='lightingenabled feature_enabled showtip' type='checkbox' value='1'>
                    <label class='checkbox'>&nbsp; Enabled</label>
                    <div class='subsettings'>
                        <div>
                            <input class='lightenforcelos showtip' title='Player&#39;s line of sight set by what tokens they can control.' type='checkbox' value='1'>
                            <label class='checkbox'>&nbsp; Enforce Line of Sight</label>
                        </div>
                        <div>
                            <input class='lightingupdate' type='checkbox' value='1'>
                            <label class='checkbox'>&nbsp; Only Update on Drop</label>
                        </div>
                        <div>
                            <input class='lightglobalillum showtip' title='Instead of darkness show light in all places players can see.' type='checkbox' value='1'>
                            <label class='checkbox'>&nbsp; Global Illumination</label>
                        </div>
                    </div>
                </div>
            </div>
            <hr>
            <div class='alert alert-info' role='alert'>
                <p><strong>Legacy</strong> - in the coming months, Advanced Fog of War and Dynamic Lighting will be replaced with Updated Dynamic Lighting.</p>
            </div>
            <hr>
            <div id='gm_darkness_opacity'>
                <label class='feature_name'>
                    <strong>Darkness Opacity (GM)</strong>
                </label>
                <div class='fogopacity showtip' title='The GM can see through dark areas hidden from the players when using Fog of War, Advanced Fog of War, and/or Dynamic Lighting. This setting adjusts the opacity of those dark areas for the GM only.'></div>
            </div>
        </div>
        <div class='pagedetails tab-pane' style='display:block;'>
            <!-- * SIZE */ -->
            <div class='size_settings' id='size_settings'>
                <div class='pagedetails__header'>
                    <h3 class='page_title'>Size</h3>
                </div>
                <div class='pagedetails__subheader'>
                    <h4>Width</h4>
                </div>
                <div class='pagedetails__container grid_settings-input--list input-group'>
                    <div class='pagedetails-input size_settings-input'>
                        <div>
                            <label class='sr-only' for='page-size-width-input'>enter a custom page width in pixels</label>
                            <input id="page-size-width-input" type="number" class="width units page_setting_item" value="<$!this.model.get("width")$>" />
                        </div>
                        <div class='disable_box'>px</div>
                    </div>
                    <div class='col pagedetails-symbol'>
                        <span class='page_setting_item'>X</span>
                    </div>
                    <div class='pagedetails-input size_settings-input'>
                        <div>
                            <label class='sr-only' for='page-size-width-multiplier'>custom page width will be multiplied by 70</label>
                            <input id='page-size-width-multiplier' type="text" value="70" class="page_setting_item" disabled>
                        </div>
                        <div class='disable_box'>px</div>
                    </div>
                    <div class='col pagedetails-symbol'>
                        <span class='page_setting_item'>=</span>
                    </div>
                    <div class='pagedetails-input size_settings-input'>
                        <div>
                            <label class='sr-only' for='page-size-width-total'>total page width in pixels after being multiplied by 70</label>
                            <input id='page-size-width-total' type="number" class="px_width pixels page_setting_item" value="<$!this.model.get("width")*70$>" />
                        </div>
                        <div class='disable_box'>px</div>
                    </div>
                </div>
                <div class='pagedetails__subheader'>
                    <h4>Height</h4>
                </div>
                <div class='pagedetails__container grid_settings-input--list input-group'>
                    <div class='pagedetails-input size_settings-input'>
                        <div>
                            <label class='sr-only' for='page-size-height-input'>enter a custom page height in pixels</label>
                            <input id="page-size-height-input" type="number" class="height units page_setting_item" value="<$!this.model.get("height")$>" />
                        </div>
                        <div class='disable_box'>px</div>
                    </div>
                    <div class='col pagedetails-symbol'>
                        <span class='page_setting_item'>X</span>
                    </div>
                    <div class='pagedetails-input size_settings-input'>
                        <div>
                            <label class='sr-only' for='page-size-height-multiplier'>custom page height will be multiplied by 70</label>
                            <input id='page-size-height-multiplier' type="text" value="70" class="page_setting_item" disabled>
                        </div>
                        <div class='disable_box'>px</div>
                    </div>
                    <div class='col pagedetails-symbol'>
                        <span class='page_setting_item'>=</span>
                    </div>
                    <div class='pagedetails-input size_settings-input'>
                        <div>
                            <label class='sr-only' for='page-size-height-total'>total page height in pixels after being multiplied by 70</label>
                            <input id='page-size-height-total' type="number" class="px_height pixels page_setting_item" value="<$!this.model.get("height")*70$>" />
                        </div>
                        <div class='disable_box'>px</div>
                    </div>
                </div>
                <div class='fine-print text-muted'>
                    <p>The height and width are true to size when zoom is set to 100%.</p>
                </div>
            </div>
            <hr>
            <!-- * BACKGROUND */ -->
            <div class='background_settings'>
                <div class='pagedetails__header'>
                    <h3 class='page_title'>Background</h3>
                </div>
                <div class='pagedetails__subheader'>
                    <h4>Color</h4>
                </div>
                <input class='pagebackground' type='text'>
            </div>
            <hr>
            <!-- * SCALE */ -->
            <div class='scale_settings'>
                <div class='pagedetails__header'>
                    <h3 class='page_title'>Scale</h3>
                </div>
                <div class='pagedetails__subheader'>
                    <h4 class='text-capitalize'>grid cell distance</h4>
                </div>
                <div class='pagedetails__container'>
                    <div class='pagedetails-input scale_settings-input'>
                        <div>
                            <label class='sr-only' for='page-scale-grid-cell-distance'>enter a custom distance for each grid cell</label>
                            <input id='page-scale-grid-cell-distance' type="number" class="scale_number" value="<$!this.model.get("scale_number")$>" />
                        </div>
                        <div class='scale_settings-select'>
                            <label class='sr-only' for='page-scale-grid-cell-label-select'>choose a label for your grid cells</label>
                            <select class='scale_units' id='page-scale-grid-cell-label-select'>
                                <option value='ft'>ft.</option>
                                <option value='m'>m.</option>
                                <option value='km'>km.</option>
                                <option value='mi'>mi.</option>
                                <option value='in'>in.</option>
                                <option value='cm'>cm.</option>
                                <option value='un'>un.</option>
                                <option value='hex'>hex</option>
                                <option value='sq'>sq.</option>
                                <option value='custom'>Custom</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class='hidden' id='custom_scale_units'>
                    <div class='pagedetails__subheader'>
                        <h4>custom label</h4>
                    </div>
                    <div class='pagedetails__container'>
                        <div class='pagedetails-input custom_scale_units-input'>
                            <label class='sr-only' for='page-scale-grid-cell-custom-label'>enter a custom label for your grid cells</label>
                            <input id="page-scale-grid-cell-custom-label" type="text" value="<$!this.model.get("scale_units")$>" />
                        </div>
                    </div>
                </div>
            </div>
            <hr>
            <!-- * GRID */ -->
            <div class='grid_settings' data-feature_enabled='showgrid' id='grid_settings'>
                <div class='row'>
                    <div class='col-xs-7 pagedetails__header'>
                        <h3 class='page_title'>Grid</h3>
                    </div>
                    <div class='col-xs-3 grid_switch'>
                        <label class='switch'>
                            <label class='sr-only' for='page-grid-display-toggle'>toggle the page grid</label>
                            <input class='gridenabled feature_enabled' id='page-grid-display-toggle' type='checkbox' value='1'>
                            <span class='slider round'></span>
                            </input>
                        </label>
                    </div>
                </div>
                <div class='grid_subsettings' id='grid_subsettings'>
                    <div class='pagedetails__container'>
                        <div class='pagedetails__subheader'>
                            <h4>Type</h4>
                        </div>
                        <div class='grid_settings-select'>
                            <label class='sr-only' for='gridtype'>select the grid type</label>
                            <select id='gridtype'>
                                <option selected value='square'>Square</option>
                                <option value='hex'>Hex (V)</option>
                                <option value='hexr'>Hex (H)</option>
                            </select>
                        </div>
                    </div>
                    <div class='pagedetails__container grid_settings-row--hex flex-wrap align-items-center' id='hexlabels'>
                        <div class='col-xs-7 pagedetails__subheader'>
                            <h4>show hex labels</h4>
                        </div>
                        <div class='col-xs-3 grid_switch'>
                            <label class='switch'>
                                <label class='sr-only' for='page-grid-hex-label-toggle'>toggle display labels inside of hexes</label>
                                <input class='gridlabels' id='page-grid-hex-label-toggle' type='checkbox' value='1'>
                                <span class='slider round'></span>
                                </input>
                            </label>
                        </div>
                    </div>
                    <div class='pagedetails__subheader help-icon'>
                        <h4>Measurement</h4>
                        <a class='tipsy-w showtip pictos' href='https://roll20.zendesk.com/hc/en-us/articles/360039674913-Ruler' target='_blank' title='Controls how diagonal cells are measured.'>?</a>
                    </div>
                    <div class='pagedetails__container'>
                        <div class='grid_settings-select'>
                            <select id='diagonaltype'>
                                <option class='squareonly' selected value='foure'>D&D 5E/4E Compatible</option>
                                <option class='squareonly' value='threefive'>Pathfinder/3.5E Compatible</option>
                                <option class='squareonly' value='manhattan'>Manhattan</option>
                                <option class='hexonly' value='hex'>Hex Path</option>
                                <option value='pythagorean'>Euclidean</option>
                            </select>
                        </div>
                    </div>
                    <div class='pagedetails__subheader help-icon'>
                        <h4>Cell Width</h4>
                        <a class='tipsy-w showtip pictos' href='https://roll20.zendesk.com/hc/en-us/articles/360039675373-Page-Settings' target='_blank' title='The number of cells per 70 pixels in your grid. Ex .5 = 35 pixels per cell.'>?</a>
                    </div>
                    <div class='pagedetails__container grid_settings-input--list'>
                        <div class='pagedetails-input grid_settings-input'>
                            <label class='sr-only' for='page-grid-cell-width-input'>enter a custom cell width</label>
                            <input id="page-grid-cell-width-input" type="number" class="grid-cell-width snappingincrement units" value="<$!this.model.get("snapping_increment")$>" />
                        </div>
                        <div class='col pagedetails-symbol'>
                            <span class='page_setting_item'>X</span>
                        </div>
                        <div class='pagedetails-input grid_settings-input'>
                            <div>
                                <label class='sr-only' for='page-grid-cell-width-multiplier'>custom cell width will be multiplied by 70</label>
                                <input id='page-grid-cell-width-multiplier' type="text" value="70" class="page_setting_item" disabled>
                            </div>
                            <div class='disable_box'>px</div>
                        </div>
                        <div class='col pagedetails-symbol'>
                            <span class='page_setting_item'>=</span>
                        </div>
                        <div class='pagedetails-input grid_settings-input'>
                            <div>
                                <label class='sr-only' for='page-grid-cell-width-total'>total cell width in pixels after being multiplied by 70</label>
                                <input id="page-grid-cell-width-total" type="number" class="px_snappingincrement pixels" value="<$!this.model.get("snapping_increment")*70$>" />
                            </div>
                            <div class='disable_box'>px</div>
                        </div>
                    </div>
                    <div class='pagedetails__subheader'>
                        <h4>Color</h4>
                    </div>
                    <div class='pagedetails__container'>
                        <div>
                            <input class='gridcolor' type='text'>
                        </div>
                    </div>
                    <div class='pagedetails__subheader'>
                        <h4>Opacity</h4>
                    </div>
                    <div class='pagedetails__container'>
                        <div>
                            <div class='gridopacity'></div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- * Movement */ -->
            <hr>
            <div class='restrict_movement lighting_feature' id='restict_movement'>
                <div class='pagedetails__header w-100'>
                    <h3 class='page_title text-capitalize'>movement</h3>
                </div>
                <div class='pagedetails__container d-flex'>
                    <div class='row'>
                        <div class='col-xs-7 pagedetails__subheader'>
                            <h4 class='text-capitalize'>dynamic lighting barriers restrict movement</h4>
                        </div>
                        <div class='col-xs-3 grid_switch'>
                            <label class='switch'>
                                <label class='sr-only' for='page-dynamic-lighting-line-restrict-movement-toggle'>dynamic lighting lines restrict movement toggle</label>
                                <input class='lightrestrictmove showtip' id='page-dynamic-lighting-line-restrict-movement-toggle' title='Don&#39;t allow player tokens to move through Dynamic Lighting walls. Can be enabled even if lighting is not used.' type='checkbox' value='1'>
                                <span class='slider round'></span>
                                </input>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <!-- * Audio */ -->
            <hr>
            <div class='audio_settings'>
                <div class='pagedetails__header'>
                    <h3 class='page_title'>Audio</h3>
                </div>
                <div class='pagedetails__subheader'>
                    <h4>Play on Load</h4>
                </div>
                <div class='pagedetails__container'>
                    <label class='sr-only' for='page-audio-play-on-load'>play an audio track on page load</label>
                    <select class='pagejukeboxtrigger' id='page-audio-play-on-load'></select>
                </div>
            </div>

            <!-- BEGIN MOD -->
            <hr>
             <div>
                <div class='pagedetails__header'>
                    <h3 class='page_title'>Extensions by betteR20</h3>
                </div>
                <button class='btn Ve-btn-weather'>
					Configure Weather
				</button>
                <button class='btn Ve-btn-views'>
					Configure Views
				</button>
            </div>
			<!-- END MOD -->

            <!-- * Archive & Delete Buttons */ -->
            <hr>
            <div class='page-buttons d-flex flex-wrap justify-content-between'>
                <button class='archive btn'>Archive Page</button>
                <button class='delete btn btn-danger'>Delete Page</button>
            </div>
        </div>

        <div class='lighting tab-pane'>
            <div class='border_box lighting_feature' data-feature_enabled='dyn_fog_prototype_enabled' id='dyn_fog_prototype_settings'>
				<!-- BEGIN MOD -->
				<strong style="display: block; margin-bottom: 10px;"><i>Requires a paid subscription or all players to use a betteR20 script</i></strong>
				<hr>
				<!-- END MOD -->
                <div class='alert alert-info' role='alert'>
                    <p>This feature is in Active Development: Turning on Updated Dynamic Lighting will turn off Legacy Dynamic Lighting for this page. If you want to go back, you’ll need to turn on Legacy back on for the Page. Revealed areas in one system will not be revealed in the other.  Consider testing the feature in a copy or new game. <a href="https://app.roll20.net/forum/permalink/8422745" target='_blank'>Read More…</a></p>
                </div>
                <div class='dyn_fog_settings'>
                    <div class='row'>
                        <div class='col-xs-6'>
                            <p class='dynamic_lighting_title'>Dynamic Lighting</p>
                        </div>
                        <div class='col-xs-3 dyn_fog_switch'>
                            <label class='switch'>
                                <input class='dyn_fog_enabled feature_enabled' type='checkbox'>
                                <span class='slider round'></span>
                                </input>
                            </label>
                        </div>
                    </div>
                </div>
                <hr>
                <div class='explorer_mode'>
                    <div class='row'>
                        <div class='col-xs-6'>
                            <p class='explorer_mode_title'>Explorer Mode</p>
                        </div>
                        <div class='col-xs-3 dyn_fog_switch'>
                            <label class='switch'>
                                <input class='dyn_fog_autofog_mode' type='checkbox'>
                                <span class='slider round'></span>
                                </input>
                            </label>
                        </div>
                    </div>
                    <div class='row'>
                        <div class='col-xs-11'>
                            <p class='description'>Reveals areas of the Map Layer that Players have already explored. Does not reveal areas that were revealed when Explorer Mode is disabled. Previously called "Advanced Fog of War".</p>
                        </div>
                    </div>
                </div>
                <hr>
                <div class='daylight_mode'>
                    <div class='row'>
                        <div class='col-xs-6'>
                            <p class='explorer_mode_title'>Daylight Mode</p>
                        </div>
                        <div class='col-xs-3 dyn_fog_switch'>
                            <label class='switch'>
                                <input class='dyn_fog_global_illum' type='checkbox'>
                                <span class='slider round'></span>
                                </input>
                            </label>
                        </div>
                    </div>
                    <div class='row'>
                        <div class='col-xs-11'>
                            <p class='description'>Adds Light to the whole Page, good for a sunny day or well lit room or GMs who don't want to place a bunch of torches. Previously called "Global Illumination".</p>
                        </div>
                    </div>
                    <div class='row-fluid clearfix daylight_slider_row' style='display: none;'>
                        <div class='span2' style='float:left'>
                            <label class='distance'>Brightness</label>
                        </div>
                        <div class='span8 dyn_fog_switch' style='float:right'>
                            <div class='form-group'>
                                <div class='input-group flex-group'>
                                    <img class='dyn_fog_img_left flex-item' src='/images/editor/lightbulb_low.svg'>
                                    <input class='dyn_fog_daylight_slider flex-item' max='1' min='0.05' step='0.05' type='range' value='1'>
                                    <img class='dyn_fog_img_right flex-item' src='/images/editor/lightbulb_high.svg'>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <hr>
                <div class='update_on_drop_mode'>
                    <div class='row'>
                        <div class='col-xs-6'>
                            <p class='update_on_drop_title'>Update when Token Drop</p>
                        </div>
                        <div class='col-xs-3 dyn_fog_switch'>
                            <label class='switch'>
                                <input class='dyn_fog_update_on_drop' type='checkbox'>
                                <span class='slider round'></span>
                                </input>
                            </label>
                        </div>
                    </div>
                    <div class='row'>
                        <div class='col-xs-11'>
                            <p class='description'>When dragging and dropping a token, the lighting will only change after a player has dropped, not while dragging.</p>
                        </div>
                    </div>
                </div>
                <hr>
                <div class='gm_darkness_opacity'>
                    <div class='row'>
                        <div class='col-xs-12'>
                            <p class='opacity_title'>GM Darkness Opacity</p>
                        </div>
                    </div>
                    <div class='row'>
                        <div class='col-xs-11'>
                            <p class='description'>The GM can see through dark areas hidden from the Players when using Dynamic Lighting. This setting adjusts the opacity of those dark areas for the GM only.</p>
                        </div>
                    </div>
                    <div class='row'>
                        <div class='col-xs-8'>
                            <div class='fogopacity'></div>
                        </div>
                        <div class='col-xs-1'>
                            <input class='opacity_percentage' disabled type='text'>
                        </div>
                    </div>
                </div>
                <hr>
            </div>
        </div>
    </div>
</script>`;

	d20plus.templates.templatePageSettings = templatePageSettings;
}

SCRIPT_EXTENSIONS.push(initTemplatePageSettings);

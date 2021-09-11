function initTemplateTokenEditor () {
	// no mods; just switched in to grant full features to non-pro
	const templateTokenEditor = `<script id='tmpl_tokeneditor' type='text/html'>
    <div class='dialog largedialog tokeneditor' style='display: block;'>
        <ul class='nav nav-tabs tokeneditor_navigation'>
            <li class='active'>
                <a data-tab='basic' href='javascript:void(0);'>
                    <h2>Details</h2>
                </a>
            </li>
            <li>
                <a data-tab='notes' href='javascript:void(0);'>
                    <h2>GM Notes</h2>
                </a>
            </li>
            <li class='nav-tabs--beta'>
                <span class='label label-info'>
                    Updated
                </span>
                <a data-tab='prototype' href='javascript:void(0);'>
                    <h2>Dynamic Lighting</h2>
                </a>
            </li>
            <li>
                <a data-tab='advanced' href='javascript:void(0);'>
                    <h2>Legacy Lighting</h2>
                </a>
            </li>
        </ul>
        <div class='tab-content'>
            <div class='basic tab-pane tokeneditor__details'>
                <div class='w-100 d-inline-flex flex-wrap'>
                    <!-- General -->
                    <div class='tokeneditor__col general'>
                        <div class='tokeneditor__row--general d-grid'>
                            <div class='tokeneditor__header'>
                                <h3 class='page_title text-capitalize'>general</h3>
                            </div>
                            <div class='tokeneditor__dropdown d-grid'>
                                <div class='dropdown keep-open'>
                                    <button aria-expanded='false' aria-haspopup='true' class='btn btn-default btn--circle' data-toggle='dropdown' type='button'>
                                        <span class='sr-only'>nameplate player permissions menu</span>
                                        <svg aria-hidden='true' class='svg-inline--fa' data-icon='ellipsis-v' data-prefix='fas' height='12' viewBox='0 0 192 512' width='12' xmlns='http://www.w3.org/2000/svg'>
                                            <path d='M96 184c39.8 0 72 32.2 72 72s-32.2 72-72 72-72-32.2-72-72 32.2-72 72-72zM24 80c0 39.8 32.2 72 72 72s72-32.2 72-72S135.8 8 96 8 24 40.2 24 80zm0 352c0 39.8 32.2 72 72 72s72-32.2 72-72-32.2-72-72-72-72 32.2-72 72z' fill='000000'></path>
                                        </svg>
                                    </button>
                                    <ul aria-labelledby='dLabel' class='dropdown-menu dropdown-menu--right'>
                                        <h4>Player Permissions</h4>
                                        <li class='dropdown-item'>
                                            <div class='checkbox'>
                                                <label title='allow players to see name plate'>
                                                    <input class='showplayers_name' type='checkbox'>
                                                    See
                                                </label>
                                            </div>
                                        </li>
                                        <li class='dropdown-item'>
                                            <div class='checkbox'>
                                                <label title='allow players to edit name plate'>
                                                    <input class='playersedit_name' type='checkbox'>
                                                    Edit
                                                </label>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <!-- Represents Character -->
                        <div class='tokeneditor__row'>
                            <div class='tokeneditor__subheader help-icon'>
                                <h4>Represents Character</h4>
                                <a class='showtip pictos' title='You can choose to have the token represent a Character from the Journal. If you do, the token&#39;s name, controlling players, and bar values will be based on the Character. Most times you&#39;ll just leave this set to None/Generic.'>?</a>
                            </div>
                            <div class='tokeneditor__container'>
                                <label title='select which token this character represents'>
                                    <span class='sr-only'>select which token this character represents</span>
                                    <select class='represents'>
                                        <option value=''>None/Generic Token</option>
                                        <$ _.each(window.Campaign.activeCharacters(), function(char) { $>
                                        <option value="<$!char.id$>"><$!char.get("name")$></option>
                                        <$ }); $>
                                    </select>
                                </label>
                            </div>
                        </div>
                        <!-- Name -->
                        <div class='tokeneditor__row'>
                            <div class='tokeneditor__subheader'>
                                <h4>Name</h4>
                            </div>
                            <div class='tokeneditor__container tokeneditor__container-name tokeneditor__border d-inline-grid'>
                                <div class='d-flex'>
                                    <label class='sr-only' for='token-general-character-name'>character name</label>
                                    <input class='name' id='token-general-character-name' type='text'>
                                </div>
                                <div class='tokeneditor__container-nameplate disable_box'>
                                    <div class='d-flex justify-content-center align-items-center'>
                                        <label class='sr-only' for='token-general-nameplate'>show nameplate on token</label>
                                        <input class='showname' id='token-general-nameplate' type='checkbox' value='1'>
                                    </div>
                                    <h4 class='text-capitalize'>nameplate</h4>
                                </div>
                            </div>
                        </div>
                        <!-- Controlled By -->
                        <div class='tokeneditor__row'>
                            <div class='tokeneditor__subheader'>
                                <h4>Controlled By</h4>
                            </div>
                            <div class='tokeneditor__container'>
                                <$ if(this.character) { $>
                                <p>(Determined by Character settings)</p>
                                <$ } else { $>
                                <select class='controlledby selectize' multiple='true'>
                                    <option value='all'>All Players</option>
                                    <$ window.Campaign.players.each(function(player) { $>
                                    <option value="<$!player.id$>"><$!player.get("displayname")$></option>
                                    <$ }); $>
                                </select>
                                <$ } $>
                            </div>
                        </div>
                        <!-- Tint Color -->
                        <div class='tokeneditor__row'>
                            <div class='tokeneditor__subheader'>
                                <h4>Tint Color</h4>
                            </div>
                            <div class='tokeneditor__container'>
                                <label class='sr-only' for='token-general-tint-color'>choose a tint color of the token</label>
                                <input class='tint_color colorpicker' id='token-general-tint-color' type='text'>
                            </div>
                        </div>
                    </div>
                    <!-- Token Settings -->
                    <div class='tokeneditor__col token-settings'>
                        <div class='tokeneditor__header'>
                            <h3 class='page_title text-capitalize'>token bars</h3>
                        </div>
                        <div class='tokeneditor__row tokeneditor__row--bar d-grid'>
                            <div class='col tokeneditor__bar-inputs d-grid'>
                                <div class='tokeneditor__subheader align-items-center d-grid'>
                                    <span class='bar_color_indicator' style='background-color: <$!window.Campaign.get('bar1_color')$>'></span>
                                    <h4>Bar 1</h4>
                                </div>
                                <div class='tokeneditor__container align-items-center d-grid'>
                                    <div class='tokeneditor__border'>
                                        <label title='enter bar 1 value'>
                                            <input class='bar1_value' placeholder='Value' type='text'>
                                        </label>
                                    </div>
                                    <span>/</span>
                                    <div class='tokeneditor__border'>
                                        <label title='enter bar 1 maximum value'>
                                            <input class='bar1_max' placeholder='Max' type='text'>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class='col tokeneditor__bar-select align-items-center'>
                                <div class='tokeneditor__subheader help-icon'>
                                    <h4 class='text-capitalize'>attribute</h4>
                                    <a class='pictos showtip' title='You can choose to have the token represent a Character from the Journal. If you do, the token&#39;s name, controlling players, and bar values will be based on the Character. Most times you&#39;ll just leave this set to None/Generic.'>?</a>
                                </div>
                                <div class='tokeneditor__container'>
                                    <label title='select a character sheet attribute to link to bar 1'>
                                        <span class='sr-only'>select a character sheet attribute to link to bar 1</span>
                                        <select class='bar1_link'>
                                            <option value=''>None</option>
                                            <$ _.each(this.tokensettingsview.availAttribs(), function(attrib) { $>
                                            <option value="<$!attrib.id$>"><$!attrib.name$>
                                                <$ }); $>
                                        </select>
                                    </label>
                                </div>
                            </div>
                            <div class='col tokeneditor__dropdown d-grid'>
                                <div class='dropdown keep-open'>
                                    <button aria-expanded='false' aria-haspopup='true' class='btn btn-default btn--circle' data-toggle='dropdown' type='button'>
                                        <span class='sr-only'>bar 1 player permissions menu</span>
                                        <svg aria-hidden='true' class='svg-inline--fa' data-icon='ellipsis-v' data-prefix='fas' height='12' viewBox='0 0 192 512' width='12' xmlns='http://www.w3.org/2000/svg'>
                                            <path d='M96 184c39.8 0 72 32.2 72 72s-32.2 72-72 72-72-32.2-72-72 32.2-72 72-72zM24 80c0 39.8 32.2 72 72 72s72-32.2 72-72S135.8 8 96 8 24 40.2 24 80zm0 352c0 39.8 32.2 72 72 72s72-32.2 72-72-32.2-72-72-72-72 32.2-72 72z' fill='000000'></path>
                                        </svg>
                                    </button>
                                    <ul aria-labelledby='dLabel' class='bar1 dropdown-menu dropdown-menu--right permission_section' id='myDropdown'>
                                        <h4>Player Permissions</h4>
                                        <li class='dropdown-item'>
                                            <div class='checkbox'>
                                                <label title='show players bar 1'>
                                                    <input class='showplayers_bar1' type='checkbox' value=''>
                                                    See
                                                </label>
                                            </div>
                                        </li>
                                        <li class='dropdown-item'>
                                            <div class='checkbox'>
                                                <label title='allow players to edit bar 1'>
                                                    <input class='playersedit_bar1' type='checkbox' value=''>
                                                    Edit
                                                </label>
                                            </div>
                                        </li>
                                        <li class='dropdown-item'>
                                            <label class='bar_val_permission'>
                                                Text Overlay:
                                                <select class='bar1options'>
                                                    <option value='hidden'>
                                                        Hidden
                                                    </option>
                                                    <option selected value='editors'>
                                                        Visible to Editors
                                                    </option>
                                                    <option value='everyone'>
                                                        Visible to Everyone
                                                    </option>
                                                </select>
                                            </label>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class='tokeneditor__row tokeneditor__row--bar d-grid'>
                            <div class='col tokeneditor__bar-inputs d-grid'>
                                <div class='tokeneditor__subheader align-items-center d-grid'>
                                    <span class='bar_color_indicator' style='background-color: <$!window.Campaign.get('bar2_color')$>'></span>
                                    <h4>Bar 2</h4>
                                </div>
                                <div class='tokeneditor__container align-items-center d-grid'>
                                    <div class='tokeneditor__border'>
                                        <label title='enter bar 2 value'>
                                            <input class='bar2_value' placeholder='Value' type='text'>
                                        </label>
                                    </div>
                                    <span>/</span>
                                    <div class='tokeneditor__border'>
                                        <label title='enter bar 2 maximum value'>
                                            <input class='bar2_max' placeholder='Max' type='text'>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class='col tokeneditor__bar-select align-items-center'>
                                <div class='tokeneditor__subheader help-icon'>
                                    <h4 class='text-capitalize'>attribute</h4>
                                </div>
                                <div class='tokeneditor__container'>
                                    <label title='select a character sheet attribute to link to bar 2'>
                                        <span class='sr-only'>select a character sheet attribute to link to bar 2</span>
                                        <select class='bar2_link'>
                                            <option value=''>None</option>
                                            <$ _.each(this.tokensettingsview.availAttribs(), function(attrib) { $>
                                            <option value="<$!attrib.id$>"><$!attrib.name$>
                                                <$ }); $>
                                        </select>
                                    </label>
                                </div>
                            </div>
                            <div class='col tokeneditor__dropdown d-grid'>
                                <div class='dropdown keep-open'>
                                    <button aria-expanded='false' aria-haspopup='true' class='btn btn-default btn--circle' data-toggle='dropdown' type='button'>
                                        <span class='sr-only'>bar 2 player permissions menu</span>
                                        <svg aria-hidden='true' class='svg-inline--fa' data-icon='ellipsis-v' data-prefix='fas' height='12' viewBox='0 0 192 512' width='12' xmlns='http://www.w3.org/2000/svg'>
                                            <path d='M96 184c39.8 0 72 32.2 72 72s-32.2 72-72 72-72-32.2-72-72 32.2-72 72-72zM24 80c0 39.8 32.2 72 72 72s72-32.2 72-72S135.8 8 96 8 24 40.2 24 80zm0 352c0 39.8 32.2 72 72 72s72-32.2 72-72-32.2-72-72-72-72 32.2-72 72z' fill='000000'></path>
                                        </svg>
                                    </button>
                                    <ul aria-labelledby='dLabel' class='bar2 dropdown-menu dropdown-menu--right permission_section' id='myDropdown'>
                                        <h4>Player Permissions</h4>
                                        <li class='dropdown-item'>
                                            <div class='checkbox'>
                                                <label title='show players bar 2'>
                                                    <input class='showplayers_bar2' type='checkbox' value=''>
                                                    See
                                                </label>
                                            </div>
                                        </li>
                                        <li class='dropdown-item'>
                                            <div class='checkbox'>
                                                <label title='allow players to edit bar 2'>
                                                    <input class='playersedit_bar2' type='checkbox' value=''>
                                                    Edit
                                                </label>
                                            </div>
                                        </li>
                                        <li class='dropdown-item'>
                                            <label class='bar_val_permission'>
                                                Text Overlay:
                                                <select class='bar2options'>
                                                    <option value='hidden'>
                                                        Hidden
                                                    </option>
                                                    <option selected value='editors'>
                                                        Visible to Editors
                                                    </option>
                                                    <option value='everyone'>
                                                        Visible to Everyone
                                                    </option>
                                                </select>
                                            </label>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class='tokeneditor__row tokeneditor__row--bar d-grid'>
                            <div class='col tokeneditor__bar-inputs d-grid'>
                                <div class='tokeneditor__subheader align-items-center d-grid'>
                                    <span class='bar_color_indicator' style='background-color: <$!window.Campaign.get('bar3_color')$>'></span>
                                    <h4>Bar 3</h4>
                                </div>
                                <div class='tokeneditor__container align-items-center d-grid'>
                                    <div class='tokeneditor__border'>
                                        <label title='enter bar 3 value'>
                                            <input class='bar3_value' placeholder='Value' type='text'>
                                        </label>
                                    </div>
                                    <span>/</span>
                                    <div class='tokeneditor__border'>
                                        <label title='enter bar 3 maximum value'>
                                            <input class='bar3_max' placeholder='Max' type='text'>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class='col tokeneditor__bar-select align-items-center'>
                                <div class='tokeneditor__subheader help-icon'>
                                    <h4 class='text-capitalize'>attribute</h4>
                                </div>
                                <div class='tokeneditor__container'>
                                    <label title='select a character sheet attribute to link to bar 3'>
                                        <span class='sr-only'>select a character sheet attribute to link to bar 3</span>
                                        <select class='bar3_link'>
                                            <option value=''>None</option>
                                            <$ _.each(this.tokensettingsview.availAttribs(), function(attrib) { $>
                                            <option value="<$!attrib.id$>"><$!attrib.name$>
                                                <$ }); $>
                                        </select>
                                    </label>
                                </div>
                            </div>
                            <div class='col tokeneditor__dropdown d-grid'>
                                <div class='dropdown keep-open'>
                                    <button aria-expanded='false' aria-haspopup='true' class='btn btn-default btn--circle' data-toggle='dropdown' type='button'>
                                        <span class='sr-only'>bar 3 player permissions menu</span>
                                        <svg aria-hidden='true' class='svg-inline--fa' data-icon='ellipsis-v' data-prefix='fas' height='12' viewBox='0 0 192 512' width='12' xmlns='http://www.w3.org/2000/svg'>
                                            <path d='M96 184c39.8 0 72 32.2 72 72s-32.2 72-72 72-72-32.2-72-72 32.2-72 72-72zM24 80c0 39.8 32.2 72 72 72s72-32.2 72-72S135.8 8 96 8 24 40.2 24 80zm0 352c0 39.8 32.2 72 72 72s72-32.2 72-72-32.2-72-72-72-72 32.2-72 72z' fill='000000'></path>
                                        </svg>
                                    </button>
                                    <ul aria-labelledby='dLabel' class='bar3 dropdown-menu dropdown-menu--right permission_section' id='myDropdown'>
                                        <h4>Player Permissions</h4>
                                        <li class='dropdown-item'>
                                            <div class='checkbox'>
                                                <label title='show players bar 3'>
                                                    <input class='showplayers_bar3' type='checkbox' value=''>
                                                    See
                                                </label>
                                            </div>
                                        </li>
                                        <li class='dropdown-item'>
                                            <div class='checkbox'>
                                                <label title='allow players to edit bar 3'>
                                                    <input class='playersedit_bar3' type='checkbox' value=''>
                                                    Edit
                                                </label>
                                            </div>
                                        </li>
                                        <li class='dropdown-item'>
                                            <label class='bar_val_permission'>
                                                Text Overlay:
                                                <select class='bar3options'>
                                                    <option value='hidden'>
                                                        Hidden
                                                    </option>
                                                    <option selected value='editors'>
                                                        Visible to Editors
                                                    </option>
                                                    <option value='everyone'>
                                                        Visible to Everyone
                                                    </option>
                                                </select>
                                            </label>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <hr>
                <!-- Token Bar Options -->
                <div class='tokenbaroptions w-100'>
                    <div class='tokeneditor__header w-100'>
                        <h3 class='page_title text-capitalize'>token bar options</h3>
                    </div>
                    <div class='w-100 d-inline-flex flex-wrap'>
                        <div class='tokeneditor__col'>
                            <div class='tokeneditor__subheader help-icon'>
                                <h4 class='text-capitalize'>location</h4>
                                <a class='showtip pictos' title='&lt;b&gt;Above:&lt;/b&gt; &lt;br&gt; All bars are above the token. (Default for new games) &lt;br&gt; &lt;b&gt;Top Overlapping:&lt;/b&gt; &lt;br&gt; The bottom-most bar overlaps the top of the token. Other bars float above it. &lt;br&gt; &lt;b&gt;Bottom Overlapping:&lt;/b&gt; &lt;br&gt; Bars fill the token from the bottom up. &lt;br&gt; &lt;b&gt;Below:&lt;/b&gt; &lt;br&gt; All bars are below the token.'>?</a>
                            </div>
                            <div class='tokeneditor__container player-permissions'>
                                <div class='permission_section barLocation'>
                                    <label class='movable_token_bar' title='select the token bar location'>
                                        <span class='sr-only'>select the token bar location</span>
                                        <select class='token_bar_location'>
                                            <option selected value='above'>
                                                Above
                                            </option>
                                            <option value='overlap_top'>
                                                Top Overlapping
                                            </option>
                                            <option value='overlap_bottom'>
                                                Bottom Overlapping
                                            </option>
                                            <option value='below'>
                                                Below
                                            </option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class='tokeneditor__col'>
                            <div class='tokeneditor__subheader help-icon'>
                                <h4 class='text-capitalize'>style</h4>
                                <a class='showtip pictos' title='&lt;b&gt;Standard:&lt;/b&gt;&lt;br&gt; Full sized token bar, displays text overlays. &lt;br&gt; &lt;b&gt;Compact:&lt;/b&gt; &lt;br&gt;Narrow token bars. No text overlay.'>?</a>
                            </div>
                            <div class='tokeneditor__container player-permissions'>
                                <div class='permission_section barLocation tokenbaroptions__style d-grid'>
                                    <label class='compact_bar align-items-center' title='Standard token bar style'>
                                        <input checked name='barStyle' type='radio' value='standard'>
                                        <span class='sr-only'>choose token bar style</span>
                                        Standard
                                    </label>
                                    <label class='compact_bar align-items-center' title='Compact token bar style'>
                                        <span class='sr-only'>choose token bar style</span>
                                        <input name='barStyle' type='radio' value='compact'>
                                        Compact
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <hr>
                <!-- Token Aura -->
                <div class='tokenaura w-100'>
                    <div class='tokeneditor__header w-100'>
                        <h3 class='page_title text-capitalize'>token aura</h3>
                    </div>
                    <div class='w-100 d-inline-flex flex-wrap'>
                        <div class='tokeneditor__col'>
                            <div class='tokenaura__header d-grid'>
                                <div class='tokeneditor__subheader'>
                                    <h4 class='text-capitalize'>Aura 1</h4>
                                </div>
                                <div class='tokeneditor__dropdown d-grid'>
                                    <div class='dropdown keep-open dropup'>
                                        <button aria-expanded='false' aria-haspopup='true' class='btn btn-default btn--circle' data-toggle='dropdown' type='button'>
                                            <span class='sr-only'>aura 1 player permissions menu</span>
                                            <svg aria-hidden='true' class='svg-inline--fa' data-icon='ellipsis-v' data-prefix='fas' height='12' viewBox='0 0 192 512' width='12' xmlns='http://www.w3.org/2000/svg'>
                                                <path d='M96 184c39.8 0 72 32.2 72 72s-32.2 72-72 72-72-32.2-72-72 32.2-72 72-72zM24 80c0 39.8 32.2 72 72 72s72-32.2 72-72S135.8 8 96 8 24 40.2 24 80zm0 352c0 39.8 32.2 72 72 72s72-32.2 72-72-32.2-72-72-72-72 32.2-72 72z' fill='000000'></path>
                                            </svg>
                                        </button>
                                        <ul aria-labelledby='dLabel' class='dropdown-menu dropdown-menu--right' id='myDropdown'>
                                            <h4>Player Permissions</h4>
                                            <li class='dropdown-item'>
                                                <div class='checkbox'>
                                                    <label title='show players aura 1'>
                                                        <input class='showplayers_aura1' type='checkbox' value=''>
                                                        See
                                                    </label>
                                                </div>
                                            </li>
                                            <li class='dropdown-item'>
                                                <div class='checkbox'>
                                                    <label title='allow players to edit aura 1'>
                                                        <input class='playersedit_aura1' type='checkbox' value=''>
                                                        Edit
                                                    </label>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class='tokenaura__container d-grid'>
                                <!-- Token Aura Diameter -->
                                <div class='tokenaura__diameter'>
                                    <div class='tokeneditor__subheader'>
                                        <h4 class='text-capitalize'>diameter</h4>
                                    </div>
                                    <div class='tokeneditor__container tokeneditor__border'>
                                        <label title='input aura 1 diameter'>
                                            <input class='aura1_radius' type='text'>
                                        </label>
                                        <div class='disable_box d-block'>
                                            <$!window.Campaign.activePage().get("scale_units")$>
                                        </div>
                                    </div>
                                </div>
                                <!-- Token Aura Shape -->
                                <div class='tokenaura__shape'>
                                    <div class='tokeneditor__subheader'>
                                        <h4 class='text-capitalize'>shape</h4>
                                    </div>
                                    <div class='tokeneditor__container'>
                                        <label title='select aura 1 shape'>
                                            <select class='aura1_options text-capitalize'>
                                                <option selected value='circle'>circle</option>
                                                <option value='square'>square</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>
                                <!-- Token Aura Tint Color -->
                                <div class='tokeneditor__tint'>
                                    <div class='tokeneditor__subheader'>
                                        <h4 class='text-capitalize'>tint color</h4>
                                    </div>
                                    <div class='tokeneditor__container'>
                                        <input class='aura1_color colorpicker' type='text'>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class='tokeneditor__col'>
                            <div class='tokenaura__header d-grid'>
                                <div class='tokeneditor__subheader'>
                                    <h4 class='text-capitalize'>Aura 2</h4>
                                </div>
                                <div class='tokeneditor__dropdown d-grid'>
                                    <div class='dropdown keep-open dropup'>
                                        <button aria-expanded='false' aria-haspopup='true' class='btn btn-default btn--circle' data-toggle='dropdown' type='button'>
                                            <span class='sr-only'>aura 2 player permissions menu</span>
                                            <svg aria-hidden='true' class='svg-inline--fa' data-icon='ellipsis-v' data-prefix='fas' height='12' viewBox='0 0 192 512' width='12' xmlns='http://www.w3.org/2000/svg'>
                                                <path d='M96 184c39.8 0 72 32.2 72 72s-32.2 72-72 72-72-32.2-72-72 32.2-72 72-72zM24 80c0 39.8 32.2 72 72 72s72-32.2 72-72S135.8 8 96 8 24 40.2 24 80zm0 352c0 39.8 32.2 72 72 72s72-32.2 72-72-32.2-72-72-72-72 32.2-72 72z' fill='000000'></path>
                                            </svg>
                                        </button>
                                        <ul aria-labelledby='dLabel' class='dropdown-menu dropdown-menu--right' id='myDropdown'>
                                            <h4>Player Permissions</h4>
                                            <li class='dropdown-item'>
                                                <div class='checkbox'>
                                                    <label title='show players aura 2'>
                                                        <input class='showplayers_aura2' type='checkbox' value=''>
                                                        See
                                                    </label>
                                                </div>
                                            </li>
                                            <li class='dropdown-item'>
                                                <div class='checkbox'>
                                                    <label title='allow players to edit aura 2'>
                                                        <input class='playersedit_aura2' type='checkbox' value=''>
                                                        Edit
                                                    </label>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div class='tokenaura__container d-grid'>
                                <!-- Token Aura Diameter -->
                                <div class='tokenaura__diameter'>
                                    <div class='tokeneditor__subheader'>
                                        <h4 class='text-capitalize'>diameter</h4>
                                    </div>
                                    <div class='tokeneditor__container tokeneditor__border'>
                                        <label title='input aura 2 diameter'>
                                            <input class='aura2_radius' type='text'>
                                        </label>
                                        <div class='disable_box d-block'>
                                            <$!window.Campaign.activePage().get("scale_units")$>
                                        </div>
                                    </div>
                                </div>
                                <!-- Token Aura Shape -->
                                <div class='tokenaura__shape'>
                                    <div class='tokeneditor__subheader'>
                                        <h4 class='text-capitalize'>shape</h4>
                                    </div>
                                    <div class='tokeneditor__container'>
                                        <label title='select aura 2 shape'>
                                            <select class='aura2_options text-capitalize'>
                                                <option selected value='circle'>circle</option>
                                                <option value='square'>square</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>
                                <!-- Token Aura Tint Color -->
                                <div class='tokeneditor__tint'>
                                    <div class='tokeneditor__subheader'>
                                        <h4 class='text-capitalize'>tint color</h4>
                                    </div>
                                    <div class='tokeneditor__container'>
                                        <input class='aura2_color colorpicker' type='text'>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- GM Notes -->
            <div class='notes tab-pane'>
                <div class='tokeneditor__header'>
                    <h3 class='d-inline'>GM Notes</h3>
                    <span>(Only visible to GMs)</span>
                </div>
                <div>
                    <textarea class='gmnotes summernote'></textarea>
                </div>
            </div>
            <!-- Legacy Lighting -->
            <div class='advanced tab-pane'>
                <div class='row-fluid'>
                    <div class='emits-light'>
                        <h4>Emits Light</h4>
                        <div class='inlineinputs' style='margin-top: 5px; margin-bottom: 5px;'>
                            <input class='light_radius' type='text'>
                            <$!window.Campaign.activePage().get("scale_units")$>.
                            <input class='light_dimradius' type='text'>
                            <$!window.Campaign.activePage().get("scale_units")$>.
                            <input class='light_angle' placeholder='360' type='text'>
                            <span style='font-size: 2.0em;'>&deg;</span>
                        </div>
                        <span style='color: #888; padding-left: 5px;'>Light Radius / (optional) Start of Dim / Angle</span>
                        <div class='inlineinputs' style='margin-top: 5px;'>
                            <label style='margin-left: 7px;'>
                                <input class='light_otherplayers' type='checkbox'>
                                All Players See Light
                            </label>
                        </div>
                        <div class='inlineinputs' style='margin-top: 2px;'>
                            <label style='margin-left: 7px;'>
                                <input class='light_hassight' type='checkbox'>
                                Has Sight
                            </label>
                            <span style="margin-left: 9px; margin-right: 28px;">/</span>
                            Angle:
                            <input class='light_losangle' placeholder='360' type='text'>
                            <span style='font-size: 2.0em;'>&deg;</span>
                        </div>
                        <div class='inlineinputs' style='margin-left: 90px; margin-top: 5px;'>
                            <span style="margin-left: 8px; margin-right: 12px;">/</span>
                            Multiplier:
                            <input class='light_multiplier' placeholder='1.0' style='margin-right: 10px;' type='text'>x</input>
                        </div>
                        <h4>Advanced Fog of War</h4>
                        <div class='inlineinputs' style='margin-top: 5px; margin-bottom: 5px;'>
                            <input class='advfow_viewdistance' type='text'>
                            <$!window.Campaign.activePage().get("scale_units")$>.
                        </div>
                        <span style='color: #888; padding-left: 5px;'>Reveal Distance</span>
                    </div>
                </div>
                <div class='alert alert-info' role='alert' style='margin-top: 5%'>
                    <p><strong>Legacy</strong> - in the coming months, Advanced Fog of War and Dynamic Lighting will be replaced with Updated Dynamic Lighting.</p>
                </div>
            </div>
            <!-- Updated Dynamic Lighting -->
            <div class='prototype tab-pane'>
                <div class='alert alert-info' role='alert'>
                    <p>This feature is in Active Development: Turning on Updated Dynamic Lighting will turn off Legacy Dynamic Lighting for this page. If you want to go back, you’ll need to turn on Legacy back on for the Page. Revealed areas in one system will not be revealed in the other.  Consider testing the feature in a copy or new game. <a href="https://app.roll20.net/forum/permalink/8422745" target='_blank'>Read More…</a></p>
                </div>
                <div class='token_vision'>
                    <p class='token_vision_title'>Token Vision</p>
                    <div class='dyn_fog_vision' style='padding-top: 10px;'>
                        <div class='row-fluid clearfix'>
                            <div class='span8'>
                                <p class='vision_title'>Vision</p>
                            </div>
                            <div class='span4 dyn_fog_switch'>
                                <label class='switch'>
                                    <input class='dyn_fog_emits_vision feature_toggle' type='checkbox'>
                                    <span class='slider round'></span>
                                    </input>
                                </label>
                            </div>
                        </div>
                        <div class='row-fluid clearfix'>
                            <div class='span8'>
                                <p class='description'>Gives the ability to see, if there is light or if Night Vision is enabled. Tokens with vision can see to the edge of the available light.</p>
                            </div>
                            <div class='span4 dyn_fog_switch'>
                                <div class='hidden'>
                                    <input class='dyn_fog_vision_range' type='number'>
                                    <input class='dyn_fog_dim_vision_range' type='number'>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <div class='dyn_fog_dark_vision' style='padding-top: 10px;'>
                        <div class='row-fluid clearfix'>
                            <div class='span8'>
                                <p class='vision_title'>Night Vision</p>
                            </div>
                            <div class='span4 dyn_fog_switch'>
                                <label class='switch'>
                                    <input class='dyn_fog_emits_dark_vision feature_toggle' data-target='.dark_vision_input' data-toggle='toggle' type='checkbox'>
                                    <span class='slider round'></span>
                                    </input>
                                </label>
                            </div>
                        </div>
                        <div class='row-fluid clearfix'>
                            <div class='span12'>
                                <p class='description'>Give this token the ability to see without any light.</p>
                            </div>
                        </div>
                        <div class='row-fluid clearfix toggle-element dark_vision_input'>
                            <div class='span8'>
                                <label class='distance'>Night Vision Distance</label>
                            </div>
                            <div class='span4 dyn_fog_switch'>
                                <div class='form-group'>
                                    <div class='input-group'>
                                        <input class='dyn_fog_dark_vision_range' min='0' type='number'>
                                        <span class='input-group-addon'><$!window.Campaign.activePage().get("scale_units")$></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class='row-fluid clearfix'>
                            <div class='alert alert-danger negative_number_alert_night_vision hidden' role='alert'>
                                <p>Please enter a positive number.</p>
                            </div>
                        </div>
                        <div class='row-fluid clearfix toggle-element dark_vision_input'>
                            <div class='span8'>
                                <label class='vision-color'>Tint Color</label>
                            </div>
                            <div class='span4 dyn_fog_switch'>
                                <input class='dyn_fog_dark_vision_color colorpicker' type='text'>
                            </div>
                        </div>
                        <div class='row-fluid clearfix toggle-element dark_vision_input' style='padding-top: 10px'>
                            <div class='span8'>
                                <label>Night Vision Effect</label>
                            </div>
                            <div class='span4 dyn_fog_switch'>
                                <div class='form-group' style='float:right;'>
                                    <div class='input-group'>
                                        <label class='dyn_fog_dropdown'>
                                            <select class='dyn_fog_dark_vision_effect form-control'>
                                                <option value=''>None</option>
                                                <option value='Nocturnal'>Nocturnal</option>
                                                <option value='Dimming'>Dimming</option>
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class='row-fluid clearfix toggle-element dark_vision_input dyn_fog_dark_fx_dimming_row hidden' style='padding-top: 10px'>
                            <div class='span8'>
                                <label class='dyn_fog_dark_vision_color'>Dimming Start</label>
                            </div>
                            <div class='span4 dyn_fog_switch'>
                                <div class='form-group'>
                                    <div class='input-group'>
                                        <input class='dyn_fog_dark_vision_effect_dimming' max='100' min='0' step='0.01' type='number' value='5'>
                                        <span class='input-group-addon'><$!window.Campaign.activePage().get("scale_units")$></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class='row-fluid clearfix'>
                            <div class='alert alert-danger negative_number_alert_night_vision_dimming hidden' role='alert'>
                                <p>Please enter a positive number.</p>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <div class='limit_field_of_vision hidden' style='padding-top: 10px;'>
                        <div class='row-fluid clearfix'>
                            <div class='span8'>
                                <p class='vision_title'>Limit Field of Vision</p>
                            </div>
                            <div class='span4 dyn_fog_switch'>
                                <label class='switch'>
                                    <input class='field_of_vision feature_toggle' data-target='.field_of_vision_inputs' data-toggle='toggle' type='checkbox'>
                                    <span class='slider round'></span>
                                    </input>
                                </label>
                            </div>
                        </div>
                        <div class='row-fluid clearfix'>
                            <div class='span12'>
                                <p class='description'>Limit the field revealed for the token.</p>
                            </div>
                        </div>
                        <div class='row-fluid clearfix toggle-element field_of_vision_inputs'>
                            <div class='span3'>
                                <label class='distance'>Total</label>
                            </div>
                            <div class='span3 dyn_fog_switch'>
                                <div class='form-group'>
                                    <div class='input-group'>
                                        <input class='field_of_vision_total' max='360' min='0' type='number'>
                                        <span class='input-group-addon'>&deg;</span>
                                    </div>
                                </div>
                            </div>
                            <div class='span3'>
                                <label class='distance'>Center</label>
                            </div>
                            <div class='span3 dyn_fog_switch'>
                                <div class='form-group'>
                                    <div class='input-group'>
                                        <input class='field_of_vision_center' max='360' min='0' type='number'>
                                        <span class='input-group-addon'>&deg;</span>
                                    </div>
                                </div>
                            </div>
                            <div class='row-fluid clearfix'></div>
                            <div class='row-fluid clearfix'>
                                <div class='alert alert-danger wrong_number_alert_vision hidden' role='alert'>
                                    <p>Please enter a number between 0-360.</p>
                                </div>
                            </div>
                            <div class='row-fluid clearfix'>
                                <div class='span6'>
                                    <p class='description'>Total size of the Field of Vision.</p>
                                </div>
                                <div class='span6'>
                                    <p class='description'>50% of Vision is before the Center, 50% is after.</p>
                                </div>
                            </div>
                        </div>
                        <hr>
                    </div>
                </div>
                <div class='token_light'>
                    <p class='token_light_title'>Token Emits Light</p>
                    <div class='dyn_fog_light' style='padding-top: 10px;'>
                        <div class='row-fluid clearfix'>
                            <div class='span8'>
                                <p class='light_title'>Bright Light</p>
                            </div>
                            <div class='span4 dyn_fog_switch'>
                                <label class='switch'>
                                    <input class='dyn_fog_emits_light feature_toggle' data-target='.bright_light_input' data-toggle='toggle' type='checkbox'>
                                    <span class='slider round'></span>
                                    </input>
                                </label>
                            </div>
                        </div>
                        <div class='row-fluid clearfix'>
                            <div class='span8'>
                                <p class='description'>Makes the token emit Bright Light. Enable this to set its Distance.</p>
                            </div>
                        </div>
                        <div class='row-fluid clearfix toggle-element bright_light_input'>
                            <div class='span8'>
                                <label class='distance'>Bright Light Distance</label>
                            </div>
                            <div class='span4 dyn_fog_switch'>
                                <div class='form-group'>
                                    <div class='input-group'>
                                        <input class='dyn_fog_light_range' min='0' type='number'>
                                        <span class='input-group-addon'><$!window.Campaign.activePage().get("scale_units")$></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class='row-fluid clearfix'>
                            <div class='alert alert-danger negative_number_alert_bright_light hidden' role='alert'>
                                <p>Please enter a positive number.</p>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <div class='dyn_fog_dim_light' style='padding-top: 10px;'>
                        <div class='row-fluid clearfix'>
                            <div class='span8'>
                                <p class='light_title'>Low Light</p>
                            </div>
                            <div class='span4 dyn_fog_switch'>
                                <label class='switch'>
                                    <input class='dyn_fog_emits_dim_light feature_toggle' data-target='.low_light_input' data-toggle='toggle' type='checkbox'>
                                    <span class='slider round'></span>
                                    </input>
                                </label>
                            </div>
                        </div>
                        <div class='row-fluid clearfix'>
                            <div class='span8'>
                                <p class='description'>Makes the token emit Low Light, in addition to any Bright Light set above. Enable this to set its Distance.</p>
                            </div>
                        </div>
                        <div class='row-fluid clearfix toggle-element low_light_input'>
                            <div class='span8'>
                                <label class='distance'>Low Light Distance</label>
                            </div>
                            <div class='span4 dyn_fog_switch'>
                                <div class='form-group'>
                                    <div class='input-group'>
                                        <input class='dyn_fog_dim_light_range' min='0' type='number'>
                                        <span class='input-group-addon'><$!window.Campaign.activePage().get("scale_units")$></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class='row-fluid clearfix toggle-element low_light_input'>
                            <div class='span8'>
                                <label class='distance'>Brightness</label>
                            </div>
                            <div class='span4 dyn_fog_switch'>
                                <div class='form-group'>
                                    <div class='input-group flex-group'>
                                        <img class='dyn_fog_img_left flex-item' src='/images/editor/lightbulb_low.svg'>
                                        <input class='dyn_fog_dim_light_opacity flex-item' max='1' min='0.2' step='0.05' type='range'>
                                        <img class='dyn_fog_img_right flex-item' src='/images/editor/lightbulb_high.svg'>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class='row-fluid clearfix'>
                            <div class='alert alert-danger negative_number_alert_dim_light hidden' role='alert'>
                                <p>Please enter a positive number.</p>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <div class='directional_bright_light hidden' style='padding-top: 10px;'>
                        <div class='row-fluid clearfix'>
                            <div class='span8'>
                                <p class='light_title'>Directional Light</p>
                            </div>
                            <div class='span4 dyn_fog_switch'>
                                <label class='switch'>
                                    <input class='directional_bright_light_toggle feature_toggle' data-target='.directional_bright_light_inputs' data-toggle='toggle' type='checkbox'>
                                    <span class='slider round'></span>
                                    </input>
                                </label>
                            </div>
                        </div>
                        <div class='row-fluid clearfix'>
                            <div class='span12'>
                                <p class='description'>Set the direction of the Light emitting from this token.</p>
                            </div>
                        </div>
                        <div class='row-fluid clearfix toggle-element directional_bright_light_inputs'>
                            <div class='span3'>
                                <label class='distance'>Total</label>
                            </div>
                            <div class='span3 dyn_fog_switch'>
                                <div class='form-group'>
                                    <div class='input-group'>
                                        <input class='directional_bright_light_total' max='360' min='0' type='number'>
                                        <span class='input-group-addon'>&deg;</span>
                                    </div>
                                </div>
                            </div>
                            <div class='span3'>
                                <label class='distance'>Center</label>
                            </div>
                            <div class='span3 dyn_fog_switch'>
                                <div class='form-group'>
                                    <div class='input-group'>
                                        <input class='directional_bright_light_center' max='360' min='0' type='number'>
                                        <span class='input-group-addon'>&deg;</span>
                                    </div>
                                </div>
                            </div>
                            <div class='row-fluid clearfix'></div>
                            <div class='row-fluid clearfix'>
                                <div class='alert alert-danger wrong_number_alert_bright hidden' role='alert'>
                                    <p>Please enter a number between 0-360.</p>
                                </div>
                            </div>
                            <div class='row-fluid clearfix'>
                                <div class='span6'>
                                    <p class='description'>Total size of the Field of Light.</p>
                                </div>
                                <div class='span6'>
                                    <p class='description'>50% of Light is before the Center, 50% is after.</p>
                                </div>
                            </div>
                        </div>
                        <hr>
                        <div class="row-fluid clearfix">
                            <div class="span8">
                                <label class="light_title">Light Color</label>
                            </div>
                            <div class="span4 dyn_fog_switch">
                                <input class="dyn_fog_light_color colorpicker" type="text" value="transparent" style="display: none;">
                            </div>
                        </div>
                        <hr>
                    </div>
                    <div class='total_light'>
                        <div class='row-fluid clearfix'>
                            <div class='span8'>
                                <p class='light_title'>Total Light</p>
                            </div>
                            <div class='span4 dyn_fog_switch'>
                                <div class='form-group'>
                                    <div class='input-group'>
                                        <input class='total_light_input' disabled type='number' value='0'>
                                        <span class='input-group-addon'><$!window.Campaign.activePage().get("scale_units")$></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class='row-fluid clearfix'>
                            <div class='span8'>
                                <p class='description'>Amount of light emitting from this token.</p>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <div class='token_light'>
                        <div aria-expanded='false' class='span8' data-target='.collapse_dyn_fog_advance' data-toggle='collapse' style='display:flex'>
                            <p class='token_light_title' style='flex:1'>Advanced Settings</p>
                            <i aria-expanded='false' class='fa fa-chevron-up collapse_dyn_fog_advance' style='font-size:20px;cursor: pointer;'></i>
                            <i aria-expanded='false' class='fa fa-chevron-down collapse_dyn_fog_advance' style='font-size:20px;cursor: pointer;'></i>
                        </div>
                        <div class='dyn_fog_light' style='padding-top: 10px;'></div>
                        <div class='total_light collapse collapse_dyn_fog_advance'>
                            <div class='row-fluid clearfix'>
                                <div class='span8'>
                                    <p class='light_title'>Light Multiplier</p>
                                </div>
                                <div class='span4 dyn_fog_switch'>
                                    <div class='form-group'>
                                        <div class='input-group'>
                                            <input class='light_multi_input' min='1' type='number' value='100'>
                                            <span class='input-group-addon'>%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class='row-fluid clearfix'>
                                <div class='span8'>
                                    <p class='description'>This changes the effective radius of light for this player. A setting of 200% will let this player see light from twice it’s set radius.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</script>`;

	d20plus.templates.templateTokenEditor = templateTokenEditor;
}

SCRIPT_EXTENSIONS.push(initTemplateTokenEditor);

/*!
 * ${copyright}
 */

// Provides control sap.m.SelectionDetails.
sap.ui.define(['jquery.sap.global', './library', 'sap/ui/core/Control', 'sap/m/Button', 'sap/ui/base/Interface'],
	function(jQuery, library, Control, Button, Interface) {
	"use strict";

	/**
	 * Constructor for a new SelectionDetails.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * The control provides a popover which displays the details of the items selected in the chart. This control should be used in toolbar suite.ui.commons.ChartContainer and sap.ui.comp.smartchart.SmartChart controls. At first the control is rendered as a button, that opens the popup after clicking on it.
	 *
	 * @author SAP SE
	 * @version ${version}
	 *
	 * @constructor
	 * @private
	 * @experimental Since 1.48.0 The control is currently under development. The API could be changed at any point in time. Please take this into account when using it.
	 * @alias sap.m.SelectionDetails
	 */
	var SelectionDetails = Control.extend("sap.m.SelectionDetails", /** @lends sap.m.SelectionDetails.prototype */ { metadata : {
		library : "sap.m",
		properties : {

			/**
			 * The text to be displayed in the button. The value of this property is a translatable resource. It will be appended by the number of items selected on the chart, for example Details (3) for three selected items on the chart.
			 */
			text : {type : "string", group : "Appearance", defaultValue : "Details"}
		},
		defaultAggregation : "items",
		aggregations : {
				/**
				 * Contains {@link sap.m.SelectionDetailsItem items} that are displayed on the first page.
				 */
				"items" : {type : "sap.m.SelectionDetailsItem", multiple : true,  bindable : "bindable"},

				/**
				 * Contains custom actions shown in the responsive toolbar below items on the first page.
				 */
				"actions" : {type : "sap.ui.core.Item", multiple : true},

				/**
				 * Contains actions that are rendered as a dedicated {@link sap.m.ActionListItem item}.
				 * In case an action group is pressed, a navigation should be triggered via <code>navTo</code> method.
				 */
				"actionGroups" : {type : "sap.ui.core.Item", multiple : true},

				/**
				 * Hidden aggregation that contains the popover.
				 */
				"_popover": {type : "sap.m.ResponsivePopover", multiple : false, visibility : "hidden"},

				/**
				 * Hidden aggregation that contains the button.
				 *
				 */
				"_button": {type : "sap.m.Button", multiple : false, visibility : "hidden"}
		},
		events : {
			/**
			 * Event is fired before the popover is open.
			 */
			beforeOpen : {},

			/**
			 * Event is fired before the popover is closed.
			 */
			beforeClose : {},

			/**
			 * Event is fired when the custom action is pressed on the {@link sap.m.SelectionDetailsItem item} belonging to the items aggregation.
			 */
			navigate : {
				parameters : {
					/**
					 * The item on which the action has been pressed.
					 */
					item : {type : "sap.m.SelectionDetailsItem"},

					/**
					 * The direction of navigation. Can be either 'forward' or 'backward'. Backward means that the navigation occurred as a result of activating the back button on the current page.
					 */
					direction : {type : "string"},

					/**
					 * The custom content from which the navigation occurs. Null if navigating from first page.
					 */
					contentFrom : {type : "sap.ui.core.Control"},

					/**
					 * The custom content to which the navigation occurs. Null if navigating to first page.
					 */
					contentTo : {type : "sap.ui.core.Control"}
				}
			},

			/**
			 * Event is fired when the custom action is pressed.
			 */
			actionPress : {
				parameters : {

					/**
					 * The action that has to be processed once the action has been pressed.
					 */
					action : {type : "sap.ui.core.Item"},

					/**
					 * If the action is pressed on one of the {@link sap.m.SelectionDetailsItem items}, the parameter contains a reference to the pressed {@link sap.m.SelectionDetailsItem item}. If a custom action or action group of the SelectionDetails popover is pressed, this parameter refers to all {@link sap.m.SelectionDetailsItem items}.
					 */
					items : {type : "sap.m.SelectionDetailsItem"}
				}
			}
		}
	}});

	/* =========================================================== */
	/* Lifecycle methods                                           */
	/* =========================================================== */
	SelectionDetails.prototype.init = function() {
		this.setAggregation("_button", new Button({
			id : this.getId() + "-button",
			type : library.ButtonType.Transparent,
			press : [this._onToolbarButtonPress, this]
		}), true);
		this._oItemFactory = null;
	};

	SelectionDetails.prototype.onBeforeRendering = function () {
		this.getAggregation("_button").setProperty("text", this.getText(), true);
	};

	/* =========================================================== */
	/* API methods                                                 */
	/* =========================================================== */
	/**
	 * Returns true if the SelectionDetails is open, otherwise false.
	 * @returns {boolean} True if the SelectionDetails is open, otherwise false.
	 * @public
	 */
	SelectionDetails.prototype.isOpen = function() {
		var oPopover = this.getAggregation("_popover");
		return oPopover ? oPopover.isOpen() : false;
	};

	/**
	 * Returns true if the SelectionDetails is enabled, otherwise false.
	 * @returns {boolean} True if the SelectionDetails contains items, otherwise false.
	 * @public
	 */
	SelectionDetails.prototype.isEnabled = function() {
		return this.getItems().length > 0;
	};

	/**
	 * Returns the public facade of the SelectionDetails control for non inner framework usages.
	 * @returns {sap.ui.base.Interface} the reduced facade for outer framework usages
	 * @protected
	 */
	SelectionDetails.prototype._aFacadeMethods = ["setText", "getText", "isOpen"];
	SelectionDetails.prototype.getFacade = function() {
		var oFacade = new Interface(this, SelectionDetails.prototype._aFacadeMethods);
		this.getFacade = jQuery.sap.getter(oFacade);
		return oFacade;
	};

	/* =========================================================== */
	/* Private methods                                             */
	/* =========================================================== */
	/**
	 * Opens SelectionDetails as ResponsivePopover. Creates the structure of the popup and fills the first page.
	 * @param {object} NavContainer the constructor of sap.m.NavContainer
	 * @param {object} ResponsivePopover the constructor of sap.m.ResponsivePopover
	 * @param {object} Page the constructor of sap.m.Page
	 * @param {object} OverflowToolbar the constructor of sap.m.OverflowToolbar
	 * @param {object} Button the constructor of sap.m.OverflowToolbarButton
	 * @param {object} List the constructor of sap.m.List
	 * @private
	 */
	SelectionDetails.prototype._handlePressLazy = function(NavContainer, ResponsivePopover, Page, OverflowToolbar, Button, List, ActionListItem) {
		var oPopover = this.getAggregation("_popover"),
			oNavContainer, oPage, oActionsToolbar, oItemsList;
		if (!oPopover) {
			oPopover = new ResponsivePopover(this.getId() + "-popover", {
				placement: library.PlacementType.Bottom,
				showHeader: false,
				contentWidth: "25rem",
				contentHeight: "20rem"
			});
			this.setAggregation("_popover", oPopover, true);
		}
		oNavContainer = oPopover.getContent()[0];
		if (!oNavContainer) {
			oNavContainer = new NavContainer(this.getId() + "-nav-container");
			oPopover.addAggregation("content", oNavContainer, true);
		}
		oPage = oNavContainer.getPages()[0];
		if (!oPage) {
			oPage = new Page(this.getId() + "-page", {
				showHeader: false
			});
			oNavContainer.addAggregation("pages", oPage, true);
		}
		oPage.destroyAggregation("content", true);
		oItemsList = this._getItemsList(List, ActionListItem);
		if (oItemsList) {
			oPage.addAggregation("content", oItemsList, true);
		}
		oActionsToolbar = this._getActionsToolbar(OverflowToolbar, Button);
		if (oActionsToolbar) {
			oPage.addAggregation("content", oActionsToolbar, true);
		}
		oPopover.openBy(this.getAggregation("_button"));
	};

	/**
	 * Calls the handler for the button click. Loads the necessary dependencies only when they are needed.
	 * @private
	 */
	SelectionDetails.prototype._onToolbarButtonPress = function() {
		sap.ui.require(['sap/m/NavContainer', 'sap/m/ResponsivePopover', 'sap/m/Page',
		'sap/m/OverflowToolbar', 'sap/m/Button', 'sap/m/List', 'sap/m/ActionListItem'], this._handlePressLazy.bind(this));
	};

	/**
	 * Creates the new overflow toolbar that will contain the buttons for actions on list level.
	 * @param {object} OverflowToolbar the constructor of sap.m.OverflowToolbar
	 * @param {object} Button the constructor of sap.m.OverflowToolbarButton
	 * @returns {sap.m.OverflowToolbar} The toolbar with action buttons.
	 * @private
	 */
	SelectionDetails.prototype._getActionsToolbar = function(OverflowToolbar, Button) {
		var oToolbar, oButton, i, aActions, oAction;
		if (!this.getActions().length) {
			return null;
		}
		oToolbar = new OverflowToolbar();
		aActions = this.getActions();
		for (i = 0; i < aActions.length; i++) {
			oAction = aActions[i];
			oButton = new Button(this.getId() + "-action-" + i, {
				text: oAction.getText(),
				enabled: oAction.getEnabled(),
				press: [oAction, this._onActionPress, this]
			});
			oToolbar.addAggregation("content", oButton, true);
		}
		return oToolbar;
	};

	/**
	 * Adds ActionListItems to list which will be used for actionGroups on list level.
	 * @param {object} ActionListItem the constructor of sap.m.ActionListItem
	 * @param {sap.m.List} oList which is the target list
	 * @returns {sap.m.List} The list with ActionListItems
	 * @private
	 */
	SelectionDetails.prototype._addActionListItems = function(ActionListItem, oList) {
		var aActionGroupItems = this.getActionGroups(), oActionListItem, i;
		for (i = 0; i < aActionGroupItems.length; i++) {
			oActionListItem = new ActionListItem(this.getId() + "-actiongroup-" + i, {
				text: aActionGroupItems[i].getText(),
				type: library.ListType.Navigation,
				press: [aActionGroupItems[i], this._onActionPress, this]
			});
			oList.addAggregation("items", oActionListItem, true);
		}
		return oList;
	};

	/**
	 * Creates the new List that contains SelectionDetailsListItems based on the items aggregation.
	 * @param {object} List the constructor of sap.m.List
	 * @returns {sap.m.List} The list items.
	 * @private
	 */
	SelectionDetails.prototype._getItemsList = function(List, ActionListItem) {
		var i, aItems, oItem, oList, oListItem;
		if (!this.getItems().length && !this.getActionGroups().length) {
			return null;
		}
		oList = new List(this.getId() + "-list");
		aItems = this.getItems();
		for (i = 0; i < aItems.length; i++) {
			oItem = aItems[i];
			oListItem = oItem._getListItem();
			oList.addAggregation("items", oListItem, true);
		}

		return this._addActionListItems(ActionListItem, oList);
	};

	/**
	 * Handles the press on the action or actionGroups by triggering the action press event on the instance of SelectionDetails.
	 * @param {sap.ui.base.Event} oEvent of action press
	 * @param {sap.ui.core.Item} The item that was used in the creation of the action button and action list item.
	 * @private
	 */
	SelectionDetails.prototype._onActionPress = function(oEvent, oAction) {
		this.fireActionPress({
			action: oAction,
			items: this.getItems()
		});
	};

	/* =========================================================== */
	/* Public and Protected methods                                             */
	/* =========================================================== */
	/**
	 * @description Closes SelectionDetails if open.
	 * @returns {sap.m.SelectionDetails} To ensure method chaining, return the SelectionDetails.
	 * @public
	 */
	SelectionDetails.prototype.close = function() {
		var oPopover = this.getAggregation("_popover");
		if (oPopover) {
			oPopover.close();
		}
		return this;
	};

	/**
	 * Method to register the factory function that creates the SelectionDetailsItems.
	 * @protected
	 * @param {any} oData Data to be passed to the factory function.
	 * @param {function} fnFunction The item factory function that returns SelectionDetailsItems.
	 * @returns {sap.m.SelectionDetails} To ensure method chaining, return the SelectionDetails.
	 */
	SelectionDetails.prototype.registerSelectionDetailsItemFactory = function(oData, fnFunction) {
		if (typeof (oData) === "function") {
			fnFunction = oData;
			oData = undefined;
		}
		if (typeof fnFunction === "function") {
			this._oItemFactory = {
				fFunction: fnFunction,
				data: oData
			};
		}
		return this;
	};
	return SelectionDetails;
});

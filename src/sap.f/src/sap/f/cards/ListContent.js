/*!
 * ${copyright}
 */
sap.ui.define(["sap/f/cards/BaseContent", "sap/m/List", "sap/m/StandardListItem", "sap/ui/base/ManagedObject", "sap/f/cards/ActionEnablement"],
	function (BaseContent, sapMList, StandardListItem, ManagedObject, ActionEnablement) {
		"use strict";

		/**
		 * Constructor for a new <code>ListContent</code>.
		 *
		 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
		 * @param {object} [mSettings] Initial settings for the new control
		 *
		 * @class
		 * A control that is a wrapper of a <code>sap.m.List</code> and allows its creation based on a configuration.
		 *
		 * @extends sap.f.cards.BaseContent
		 *
		 * @author SAP SE
		 * @version ${version}
		 *
		 * @constructor
		 * @private
		 * @since 1.62
		 * @alias sap.f.cards.ListContent
		 */
		var ListContent = BaseContent.extend("sap.f.cards.ListContent", {
			renderer: {}
		});

		/**
		 * Lazily get a configured <code>sap.m.List</code>.
		 *
		 * @private
		 * @returns {sap.m.List} The inner list
		 */
		ListContent.prototype._getList = function () {

			if (this._bIsBeingDestroyed) {
				return null;
			}

			var oList = this.getAggregation("_content");

			if (!oList) {
				oList = new sapMList({
					id: this.getId() + "-list",
					growing: false,
					showNoData: false,
					showSeparators: "None"
				});
				this.setAggregation("_content", oList);
			}

			return oList;
		};

		/**
		 * Called when control is initialized.
		 */
		ListContent.prototype.init = function () {
			BaseContent.prototype.init.apply(this, arguments);

			var oList = this._getList();
			var that = this;

			oList.attachUpdateFinished(function () {
				if (that._iVisibleItems) {
					var aItems = oList.getItems();
					for (var i = that._iVisibleItems + 1; i < aItems.length; i++) {
						aItems[i].setVisible(false);
					}
				}
			});

			this._oItemTemplate = new StandardListItem({
				iconDensityAware: false
			});
		};

		/**
		 * Called when control is destroyed.
		 */
		ListContent.prototype.exit = function () {
			if (this._oItemTemplate) {
				this._oItemTemplate.destroy();
				this._oItemTemplate = null;
			}
		};

		/**
		 * Setter for configuring a <code>sap.f.cards.ListContent</code>.
		 *
		 * @public
		 * @param {Object} oConfiguration Configuration object used to create the internal list.
		 * @returns {sap.f.cards.ListContent} Pointer to the control instance to allow method chaining.
		 */
		ListContent.prototype.setConfiguration = function (oConfiguration) {

			BaseContent.prototype.setConfiguration.apply(this, arguments);

			if (!oConfiguration) {
				return this;
			}

			if (oConfiguration.item) {
				this._setItem(oConfiguration.item);
			}

			return this;
		};

		/**
		 * Binds/Sets properties to the inner item template based on the configuration object item template.
		 * Attaches all required actions.
		 *
		 * @private
		 * @param {Object} mItem The item template of the configuration object
		 */
		ListContent.prototype._setItem = function (mItem) {
			/* eslint-disable no-unused-expressions */
			mItem.title && this._bindItemProperty("title", mItem.title.value);
			mItem.description && this._bindItemProperty("description", mItem.description.value);
			mItem.icon && mItem.icon.src && this._bindItemProperty("icon", mItem.icon.src);
			mItem.highlight && this._bindItemProperty("highlight", mItem.highlight);
			mItem.info && this._bindItemProperty("info", mItem.info.value);
			mItem.info && this._bindItemProperty("infoState", mItem.info.state);
			/* eslint-enable no-unused-expressions */

			this._attachActions(mItem, this._oItemTemplate);

			var sPath = "/";
			var oConfiguration = this.getConfiguration();
			if (oConfiguration.data && oConfiguration.data.path) {
				sPath = oConfiguration.data.path;
			}

			this._getList().bindItems({
				path: sPath,
				template: this._oItemTemplate
			});
		};

		/**
		 * Tries to create a binding info object based on sPropertyValue.
		 * If succeeds the binding info will be used for property binding.
		 * Else sPropertyValue will be set directly on the item template.
		 *
		 * @private
		 * @param {string} sPropertyName The name of the property
		 * @param {string} sPropertyValue The value of the property
		 */
		ListContent.prototype._bindItemProperty = function (sPropertyName, sPropertyValue) {
			if (!sPropertyValue) {
				return;
			}

			var oBindingInfo = ManagedObject.bindingParser(sPropertyValue);
			if (oBindingInfo) {
				this._oItemTemplate.bindProperty(sPropertyName, oBindingInfo);
			} else {
				this._oItemTemplate.setProperty(sPropertyName, sPropertyValue);
			}
		};

		ActionEnablement.enrich(ListContent);

		return ListContent;
	}
);
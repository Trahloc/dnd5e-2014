/**
 * Mixin used to add system flags enforcement to types.
 * @type {function(Class): Class}
 * @mixin
 */
export default Base => class extends Base {

  /**
   * Get the data model that represents system flags.
   * @type {typeof DataModel|null}
   * @abstract
   */
  get _systemFlagsDataModel() {
    return null;
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  prepareData() {
    super.prepareData();
    if ( ("dnd5e-2014" in this.flags) && this._systemFlagsDataModel ) {
      this.flags["dnd5e-2014"] = new this._systemFlagsDataModel(this.flags["dnd5e-2014"], { parent: this });
    }
  }

  /* -------------------------------------------- */

  /** @inheritDoc */
  async setFlag(scope, key, value) {
    if ( (scope === "dnd5e-2014") && this._systemFlagsDataModel ) {
      let diff;
      const changes = foundry.utils.expandObject({ [key]: value });
      if ( this.flags["dnd5e-2014"] ) diff = this.flags["dnd5e-2014"].updateSource(changes, { dryRun: true });
      else diff = new this._systemFlagsDataModel(changes, { parent: this }).toObject();
      return this.update({ flags: { "dnd5e-2014": diff } });
    }
    return super.setFlag(scope, key, value);
  }
};

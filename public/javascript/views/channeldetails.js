window.ChannelView = Backbone.View.extend({

    initialize: function () {
        this.render();
    },

    render: function () {
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
    },

    events: {
        "change"        : "change",
        "change #kind"  : "changeKind",
        "click .save"   : "beforeSave",
        "click .delete" : "deleteChannel",
        "drop #picture" : "dropHandler"
    },

    change: function (event) {
        // Remove any existing alert message
        utils.hideAlert();

        // Apply the change to the model
        var target = event.target;
        var change = {};
        change[target.name] = target.value;
        this.model.set(change);

        // Run validation rule (if any) on changed item
        var check = this.model.validateItem(target.id);
        if (check.isValid === false) {
            utils.addValidationError(target.id, check.message);
        } else {
            utils.removeValidationError(target.id);
        }
    },

    changeKind: function(event){
        var target = event.target;
        if($( "option:selected", target).val() == "impulse"){
            utils.showFormElement('resolution');
        }else{
            utils.hideFormElement('resolution');
        };
    },

    beforeSave: function () {
        var self = this;
        var check = this.model.validateAll();
        console.log("beforeSave");
        if (check.isValid === false) {
            utils.displayValidationErrors(check.messages);
            return false;
        }
        this.saveChannel();
        return false;
    },

    saveChannel: function () {
        var self = this;
        console.log('before save');
        this.model.save(null, {
            success: function (model) {
                self.render();
                app.navigate('channels/' + model.id, false);
                utils.showAlert('Success!', 'Channel saved successfully', 'alert-success');
            },
            error: function () {
                utils.showAlert('Error', 'An error occurred while trying to save this item', 'alert-error');
            }
        });
    },

    deleteChannel: function () {
        this.model.destroy({
            success: function () {
                alert('Channel deleted successfully');
                window.history.back();
            }
        });
        return false;
    },

});
var ns = {};
var Issue = function Issues() {
  this.text = {};
  this.pattern = {};
  this.role = {};	
}
Issue.prototype.setText = function(text) {
  this.text = text;
};
Issue.prototype.getText = function() {
  return this.text;
};
Issue.prototype.setPattern = function(pattern) {
  this.pattern = pattern;
};
Issue.prototype.getPattern = function() {
  return this.pattern;
};
Issue.prototype.setRole = function(role) {
  this.role = role;
};
Issue.prototype.getPattern = function() {
  return this.role;
};
ns.Issue = Issue;
module.exports = ns;

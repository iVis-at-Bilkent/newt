function tdParser() {
};

tdParser.getTabsArray = function( line ) {
  return line.split( '\t' );
};

tdParser.getLinesArray = function( content ) {
  var separator = /\r?\n|\r/;
  var notEmpty = function( line ) {
    return line !== '';
  };
  return content.split( separator ).filter( notEmpty );
};

module.exports = tdParser;

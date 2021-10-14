const import_ = require('esm-wallaby')(module, { cache: true });
const importDefault_ = m => import_(m).default;

const chai = require('chai');
const slug = importDefault_('../../src/slug.js');

chai.should();

describe('slug()', () => {
    it('converts input string to lowercase', () => {
        slug('HelloWorld').should.equal('helloworld');
        slug('12345AEIOU').should.equal('12345aeiou');
    });
    it('removes diacritical marks from input string', () => {
        slug('HéllöWôrld').should.equal('helloworld');
        slug('12345ÁËÎÓÜ').should.equal('12345aeiou');
    });
    it('encodes input string into uri component safe string', () => {
        slug('H%éllö Wôrl?d').should.equal('h-ello-worl-d');
        slug('1234@5+Á:ËÎÓÜ').should.equal('1234-5-a-eiou');
    });
    it('converts runs of hyphens and URI escape sequences into single hyphens', () => {
        slug('H%é--\rllö+ #Wôr&-:l?d').should.equal('h-e-llo-wor-l-d');
        slug('1\\234=@-5"+`Á:;,ËÎÓ#Ü').should.equal('1-234-5-a-eio-u');
    });
    it('trims leading and trailing hyphens', () => {
        slug('-H%é--\rllö+ #Wôr&-:l?d ').should.equal('h-e-llo-wor-l-d');
        slug('&1\\234=@-5"+`Á:;,ËÎÓ#Ü%').should.equal('1-234-5-a-eio-u');
    });
});

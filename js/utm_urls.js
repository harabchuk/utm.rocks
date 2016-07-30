
var url_parser = {

    /**
     * Creates a new RegExp object for url parsing
     * @returns {RegExp}
     */
    regex: function(){
        var
            SCHEME = '(https?:\/\/)',
            HOST = '([^\/ #"\\?&]+)',
            PATH = '([^\\? #&"]+)?',
            QUERY = '([\\?&][^ #"]+)?',
            FRAGMENT = '(#[^ #"]*)?';
        return new RegExp(SCHEME + HOST + PATH + QUERY + FRAGMENT, "ig");
    },

    /**
     * Removes the ? and & characters from the beginning of the string
     */
    trim_query: function(query){
        return query && query.replace(/^[\?&]?/g, '');
    },

    /**
     * Parses query string
     * Returns an array with query parts as arrays e.g. [['name','value'],['name2','value2'],..]
     */
    query_parse: function(query){
        if(!query){
            return [];
        }
        var tmp = query.replace('&amp;', '#');
        var splitted = tmp.split('&');
        var result = [];
        for(var i=0; i<splitted.length; i++){
            var part = splitted[i].replace('#', '&amp;');
            var pair = part.split('=');
            var p = [];
            if(pair.length==2){
                p = [decodeURIComponent(pair[0]), decodeURIComponent(pair[1])];
            }else{
                p = [decodeURIComponent(pair[0]), ''];
            }
            result.push(p);
        }
        return result;
    },

    /**
     * Parses url into parts
     * @returns a dictionary with url parts
     */
    parse: function(url){
        var match = url_parser.regex().exec(url);
        if(match===null){
            return null;
        }
        var query = url_parser.trim_query(match[4]);
        return {
            scheme: match[1].replace('://', ''),
            host: match[2],
            path: match[3],
            query: query,
            hash: match[5],
            query_params: url_parser.query_parse(query)
        }
    },

    /**
     * Joins all query parameters into a string
     * @param query_params array
     * @returns {string}
     */
    stringify_params: function(query_params){
        if(!query_params){
            return '';
        }
        var parts = [];
        for(var i=0; i<query_params.length; i++){
            var p = query_params[i];
            parts.push(
                encodeURIComponent(p[0])+'='+encodeURIComponent(p[1]).replace('%26amp%3B', '&amp;')
            );
        }
        return parts.join('&');
    },

    /**
     * Adds parameters to the query parameters arra
     * @param query_params [['name','value'],['name2','value2'],..]
     * @param additional_params [['name3','value'],['name4','value2'],..]
     */
    add_params: function(query_params, additional_params){
        for(var i=0; i<additional_params.length; i++){
            var name = additional_params[i][0];
            var value = additional_params[i][1];
            var found = url_parser.find_param(query_params, name);
            if(found>-1){
                query_params[found][1]=value;
            }else{
                query_params.push([name,value]);
            }
        }
    },

    /**
     * Returns an index of a parameter
     * @param query_params array with query parameters
     * @param name parameter name
     * @returns {number} index or -1
     */
    find_param: function(query_params, name){
        for(var i=0; i<query_params.length;i++){
            if(query_params[i][0]==name){
                return i;
            }
        }
        return -1;
    },

    /**
     * Creates a string from url parts
     * @param scheme http or https
     * @param host site.com
     * @param path /path/to/page.html
     * @param query_params array with query argumetns
     * @param fragment #anchor
     * @returns {string}
     */
    build_url: function(scheme, host, path, query_params, fragment){
        var url_array = [scheme, '://' + host];
        if(path)
            url_array.push(path);
        if(query_params && query_params.length)
            url_array.push('?'+url_parser.stringify_params(query_params));
        if(fragment)
            url_array.push(fragment);
        return url_array.join('');
    },

    /**
     * Updates the url with additional parameters.
     * @param url
     * @param params [['name3','value'],['name4','value2'],..]
     * @returns {string}
     */
    update_url: function(url, params){
        var parts = url_parser.parse(url);
        if(parts===null){
            return url;
        }
        url_parser.add_params(parts['query_params'], params);
        return url_parser.build_url(
            parts['scheme'],
            parts['host'],
            parts['path'],
            parts['query_params'],
            parts['hash']
        );
    },

    /**
     * Replaces urls in the text using the callback function
     */
    replace: function(text, callback) {
        return text.replace(url_parser.regex(), function(match, scheme, host, path, query, hash){
            var qs = url_parser.trim_query(query);
            var parts = {
                scheme: scheme.replace('://', ''),
                host: host,
                path: path,
                query: qs,
                hash: hash,
                query_params: url_parser.query_parse(qs)
            }
            if(callback){
                return callback(match, parts);
            }
            return match;
        });
    }

};
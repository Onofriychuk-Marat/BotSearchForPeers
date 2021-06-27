const fs = require('fs')

module.exports.sleep = (milliseconds) => {
    new Promise(resolve => setTimeout(resolve, milliseconds * 1000))
}

module.exports.readFile = (path_file) => {
    try {
        return fs.readFileSync(path_file, 'utf8')
    } catch (error) {
        console.log('Error open ' + path_file + '!')
        return undefined
    }
}

module.exports.writeFile = (path_file, json_text) => {
    try {
        fs.writeFileSync(path_file, json_text)
    } catch (error) {
        console.log('Error write ' + path_file + '!')
    }
}

module.exports.convertJSONToObject = (json_text) => {
    try  {
        return JSON.parse(json_text)
    } catch (error) {
        return undefined
    }
}

module.exports.convertObjectToJSON = (object) => {
    try {
        return JSON.stringify(object)
    } catch (error) {
        return undefined
    }
}

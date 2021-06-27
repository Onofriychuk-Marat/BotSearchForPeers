const {Telegraf, Markup, session, Stage} = require('telegraf')

const FindPeopleInProject = require('./FindPeopleInProject').FindPeopleInProject
const UpdateDB = require('./UpdateDB')

const BOT_TOKEN = process.env.BOT_TOKEN || '1883130715:AAEy-CgFd3OimVFKx12q78aM7TLQUhLvVik'
const client_id = '0b7116a3396c2fef12a3d3a90c44403ac4c6a9daaf8f785e527f113e261e9ccf'
const client_secret = 'fd069bbb87512264a491e83b1cbea575f24b97baafdeebe10e8f16d2eae6ee82'

const updateDB = new UpdateDB(client_id, client_secret)
const bot = new Telegraf(BOT_TOKEN)
let findPeopleInProject
let select_campus

// function getMainMenu() {
//     return Markup.keyboard([
//         ['1', '2'],
//         ['3']
//     ])
// }

function getInlineKeyboard(buttons) {
    const array_buttons = buttons.map(value => {
        return Markup.button.callback(value, value)
    })
    return Markup.inlineKeyboard(array_buttons, {columns: 2})
}

bot.action(['Москва', 'Казань', 'Обновить данные'], ctx => {
    if (ctx.callbackQuery.data == 'Обновить данные') {
        const name_project = findPeopleInProject.getNameProject()
        updateDB.updateInfoProject(name_project)
        ctx.editMessageText('Обновление данных займет время. Повторите запрос через пару минут.')
        return
    }
    let mapStatuses
    if (ctx.callbackQuery.data == 'Москва') {
        mapStatuses = findPeopleInProject.getStatusesMoscowStudents()
        select_kampus = 'Москва'
    } else if (ctx.callbackQuery.data  == 'Казань') {
        mapStatuses = findPeopleInProject.getStatusesKazanStudents()
        select_kampus = 'Казань'
    }
    let response = ''
    let keys = []
    mapStatuses.forEach((value, key) => {
        response += key + ': ' + value + '. '
        keys.push(key)
    })
    ctx.editMessageText(response, getInlineKeyboard(keys))
})

const statuses = ['finished', 'searching_a_group', 'in_progress', 'creating_group', 'waiting_for_correction']
bot.action(statuses, ctx => {
    let students
    let select_statuses = ctx.callbackQuery.data
    if (select_kampus == 'Москва') {
        students = findPeopleInProject.getNamesMoscowStudentsByStatus(select_statuses)
    } else if (select_kampus == 'Казань') {
        students = findPeopleInProject.getNamesKazanStudentsByStatus(select_statuses)
    }
    ctx.reply(select_statuses + ': ' + students.join(' | '))
})

bot.start((ctx) => {
    ctx.reply('Введи название проекта.')
})

bot.on('text', ctx => {
    const name_project = ctx.message.text
    findPeopleInProject = new FindPeopleInProject(name_project)
    findPeopleInProject.start()
    select_kampus = undefined
    let response = 'Москва(' + findPeopleInProject.getCountMoscowStudents() + '), '
    response += 'Казань(' + findPeopleInProject.getCountKazanStudents() + ')'
    ctx.reply(response, getInlineKeyboard(['Москва', 'Казань', 'Обновить данные']))
})

bot.launch()
    .then(res => console.log('Started'))
    .catch(err => console.log(err))

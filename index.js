const express = require('express');
const app = express();
const bodyParser = require('body-parser')

const path = require('path')

const sqlite = require('sqlite')
const dbConnection = sqlite.open(path.resolve(__dirname, 'banco.sqlite'), { Promise })

const port = process.env.PORT || 3000

app.use('/admin', (req, res, next) =>{
    if(req.hostname === 'localhost'){
        next()
    }else {
        res.send('Not allonwed')
    }
})

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname,'public')))
app.use(bodyParser.urlencoded({extended: false}))

app.get('/', async(request, response)=> {
    console.log(new Date())
    const db = await dbConnection
    const categoriasBD = await db.all('SELECT * FROM categorias')
    const vagas = await db.all('SELECT * FROM vagas')
    const categorias = categoriasBD.map( cat => {
        return {...cat,
        vagas: vagas.filter( vaga => vaga.caegoria === cat.id)
        }
    })
    response.render('home', {
        categorias,
        vagas
    })
});
app.get('/vaga/:id', async(request, response)=> {
    console.log(new Date())
    //console.log(request.params)
    const db = await dbConnection
    const vaga = await db.get('SELECT * FROM vagas WHERE id ='+ request.params.id)
    response.render('vaga', {
        vaga
    })
});

app.get('/admin', (req, res) => {

    res.render('admin/home')
})

app.get('/admin/vagas', async(req, res) =>{
    const db = await dbConnection
    const vagas = await db.all('SELECT * FROM vagas')

    res.render('admin/vagas', {
        vagas
    })
})

app.get('/admin/categorias', async(req, res) =>{
    const db = await dbConnection
    const categorias = await db.all('SELECT * FROM categorias')
    res.render('admin/categorias', {
        categorias
    })
})

app.get('/admin/vagas/delete/:id', async(req, res) =>{
    const db = await dbConnection
    await db.run('DELETE FROM vagas WHERE id ='+ req.params.id)
    res.redirect('/admin/vagas')
})

app.get('/admin/vagas/nova', async(req, res) => {
    const db = await dbConnection
    const categorias = await db.all('SELECT * FROM categorias')
    console.log(new Date())
    res.render('admin/nova-vaga', { categorias})
})

app.get('/admin/vagas/editar/:id', async(req, res) => {
    const db = await dbConnection
    const categorias = await db.all('SELECT * FROM categorias')
    const vaga = await db.get('SELECT * FROM vagas WHERE id ='+ req.params.id)
    console.log(new Date())
    res.render('admin/editar-vaga', { categorias, vaga})
})

app.post('/admin/vagas/editar/:id', async(req, res) => {
    const {titulo, descricao, categoria} = req.body
    const db = await dbConnection
    const { id } = req.params
    await db.run(`UPDATE vagas SET caegoria = '${categoria}', titulo = '${titulo}', descricao = '${descricao}' ) WHERE id = ${ id }`)
    res.redirect('/admin/vagas')
})

app.post('/admin/vagas/nova', async(req, res) => {
    const {titulo, descricao, categoria} = req.body
    const db = await dbConnection
    await db.run(`INSERT INTO vagas(caegoria, titulo, descricao) VALUES('${categoria}','${titulo}','${descricao}')`)
    res.redirect('/admin/vagas')
})

const init = async() => {
    const db = await dbConnection
    await db.run('create table if not exists categorias(id INTEGER PRIMARY KEY, categoria TEXT);')
    await db.run('create table if not exists vagas(id INTEGER PRIMARY KEY, caegoria INTEGER, titulo TEXT, descricao TEXT);')
  //  const categoria = 'Marketing Team'
  //  await db.run(`INSERT INTO categorias(categoria) VALUES('${categoria}')`)
    
  //   const vaga = 'Marketing Team'
  //   const descricao = 'Vaga para Marketing Team Dev Pleno'
  //   await db.run(`INSERT INTO vagas(caegoria, titulo, descricao) VALUES('2', '${vaga}','${descricao}')`)
}
init()

app.listen(port, (err)=>{
    if(err){
        console.log('Não foi possivel iniciar o servidor');
    }else {
        console.log('Servidor do Jobify rodando....');
    } 
});
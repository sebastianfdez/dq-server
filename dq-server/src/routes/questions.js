const { auth, authAdmin } = require('../middleware/auth');
const express = require('express');
const questionController = require('../controllers/questions');
const { createQuestionSchema, updateQuestionSchema } = require('../validation/input');
const asyncCatch = require('../middleware/asyncCatch');
const imageRouter = require('./image');
const router = express.Router();
router.use(express.json());
router.use('/:questionID/image', imageRouter);

router.get('/', auth, asyncCatch(async (req, res) => {
	if (req.query.theme) {
		if (req.query.npb) {
			if (req.query.npb) {
				//TODO: error prototype field for response code
				if (!req.query.limit) throw new Error('Must have a limit parameter');
				const questions = await questionController.getQuestionsNotPlayedBy(req.query.npb, req.query.theme, req.query.limit);
				return res.send(questions);
			}
		}
		const questionByTheme = await questionController.getQuestionsByTheme(req.query.theme);
		return res.status(200).send(questionByTheme);
	}   
	const questions =  await questionController.getQuestions();
	return res.status(200).send(questions);
	
}));

router.get('/:id', auth, asyncCatch(async (req, res) => {
	const question = await questionController.getQuestion(req.params.id);
	return res.send(question);		
}));

router.post('/', authAdmin, asyncCatch(async (req, res) => {
	let result = createQuestionSchema.validate(req.body);
	if (result.error) {
		res.status(400).send(result.error.details[0].message);
		return;
	}
	result = await questionController.getQuestionByText(req.body.text);
	if (result) return res.status(409).send('Question with the same text already exists');
	result = await questionController.createQuestion(req.body);
	res.send(result);	
}));

router.put('/:id', authAdmin, asyncCatch(async (req,res) => {
	let result = updateQuestionSchema.validate(req.body);
	if (result.error) {
		res.status(400).send(result.error.details[0].message);
		return;
	}
	result = await questionController.getQuestionAndUpdate(req.params.id, req.body);
	return res.status(200).send(result);
}));

router.delete('/:id', authAdmin, asyncCatch(async (req,res) => {
	const result = await questionController.deleteQuestion(req.params.id);
	return res.send(result);
}));


module.exports = router;

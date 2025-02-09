import {StitchingState} from '@remotion/renderer';
import chalk from 'chalk';
import {Internals} from 'remotion';
import {AnsiDiff} from './ansi/ansi-diff';
import {RenderStep} from './step';

export const createProgressBar = (
	quiet: boolean
): {
	update: (str: string) => boolean;
} => {
	if (
		!Internals.Logging.isEqualOrBelowLogLevel(
			Internals.Logging.getLogLevel(),
			'info'
		)
	) {
		return {update: () => false};
	}

	return createOverwriteableCliOutput(quiet);
};

export const createOverwriteableCliOutput = (quiet: boolean) => {
	if (quiet) {
		return {
			update: () => false,
		};
	}

	const diff = new AnsiDiff();
	return {
		update: (up: string): boolean => process.stdout.write(diff.update(up)),
	};
};

export const makeProgressBar = (percentage: number) => {
	const totalBars = 20;
	const barsToShow = Math.floor(percentage * totalBars);
	return `[${'='.repeat(barsToShow).padEnd(totalBars, ' ')}]`;
};

export const makeBundlingProgress = ({
	progress,
	steps,
	doneIn,
}: {
	progress: number;
	steps: RenderStep[];
	doneIn: number | null;
}) =>
	[
		`(${steps.indexOf('bundling') + 1}/${steps.length})`,
		makeProgressBar(progress),
		`${doneIn ? 'Bundled' : 'Bundling'} code`,
		doneIn === null
			? (progress * 100).toFixed(0) + '%'
			: chalk.gray(`${doneIn}ms`),
	].join(' ');

type RenderingProgressInput = {
	frames: number;
	totalFrames: number;
	steps: RenderStep[];
	concurrency: number;
	doneIn: number | null;
};

export const makeRenderingProgress = ({
	frames,
	totalFrames,
	steps,
	concurrency,
	doneIn,
}: RenderingProgressInput) => {
	const progress = frames / totalFrames;
	return [
		`(${steps.indexOf('rendering') + 1}/${steps.length})`,
		makeProgressBar(progress),
		[doneIn ? 'Rendered' : 'Rendering', `frames (${concurrency}x)`]
			.filter(Internals.truthy)
			.join(' '),
		doneIn === null ? `${frames}/${totalFrames}` : chalk.gray(`${doneIn}ms`),
	].join(' ');
};

type StitchingProgressInput = {
	frames: number;
	totalFrames: number;
	steps: RenderStep[];
	doneIn: number | null;
	stage: StitchingState;
};

export const makeDownloadProgress = (progress: DownloadProgress) => {
	return [
		`(-/-)`,
		makeProgressBar(progress.progress),
		`Downloading ${progress.name}`,
	].join(' ');
};

export const makeStitchingProgress = ({
	frames,
	totalFrames,
	steps,
	doneIn,
	stage,
}: StitchingProgressInput) => {
	const progress = frames / totalFrames;
	return [
		`(${steps.indexOf('stitching') + 1}/${steps.length})`,
		makeProgressBar(progress),
		stage === 'muxing'
			? `${doneIn ? 'Muxed' : 'Muxing'} audio`
			: `${doneIn ? 'Encoded' : 'Encoding'} video`,
		doneIn === null ? `${frames}/${totalFrames}` : chalk.gray(`${doneIn}ms`),
	].join(' ');
};

export type DownloadProgress = {
	name: string;
	id: number;
	progress: number;
};

export const makeRenderingAndStitchingProgress = ({
	rendering,
	stitching,
	downloads,
}: {
	rendering: RenderingProgressInput;
	stitching: StitchingProgressInput | null;
	downloads: DownloadProgress[];
}) => {
	return [
		makeRenderingProgress(rendering),
		...downloads.map((d) => makeDownloadProgress(d)),
		stitching === null ? null : makeStitchingProgress(stitching),
	].join('\n');
};

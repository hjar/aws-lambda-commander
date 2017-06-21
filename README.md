# AWS Lambda Commander

Functions for sending shell commands to Auto Scaling Groups or single instances.

The ASG version works like this:

1. Ask which instances belong to an ASG.
1. Randomly pick one Instance ID.
1. Send the supplied command(s) to that instance.

**Tip!** You can use the `php /path/artisan schedule:run` command for autoscaled Laravel projects. The scheduler will then just run on whichever instance gets to run the command, without having to select/dedicate a server for it.

These commands will run as root so prefixing the command with `sudo -Hu apache` (or similar) will probably make sense in some deployments.

## Requirements

You should have the SSM agent installed on any instance you're sending commands to. Please refer to [AWS documentation on SSM](http://docs.aws.amazon.com/systems-manager/latest/userguide/ssm-agent.html) for instructions.

The functions use the Linux-specific `AWS-RunShellScript` command document, so these will not work with Windows as-is. But it's easy to just change the document in the code.

## Cost

When a Lambda function is run every minute it will accumulate **44640 requests** for a 31-day month. Since the minimum memory of 128 MB is plenty for this and the average duration seems to be 500 ms, we can calculate 44640 requests * (128 / 1024 GB) * 0,5 seconds = **2790 GB-seconds**.

Running Lambda at these volumes is free when your account is still under the free tier limit of 1 million requests and 400,000 GB-seconds. If we ignore the free tier, these would cost $0.0000002 per request and $0.00000104 per 500 ms. So a total of **$0.009486** per month.

See https://aws.amazon.com/lambda/pricing/ for details.

## Parameters

For **target-auto-scaling-group.js**:

`{"autoScalingGroup": "some-asg", "commands": [ "uptime" ]}`

For **target-instance.js**:

`{"instanceId": "i-11111111111111111", "commands": [ "uptime" ]}`

## Deployment

These steps will assume you have not set up anything yet and are using AWS Management Console. This process consists of setting up the Lamdba function, an IAM role and a CloudWatch Events rule.

1. Go to **Lambda** > **Create a Lambda function**
1. In the *Select blueprint* step, pick **Blank Function**.
1. In the *Configure triggers* step, click on the dashed box and pick **CloudWatch Events**.
   1. For *Rule*, select **Create a new rule**.
   1. Fill in a *Rule name*, eg. `my-app-cron`.
   1. Fill in a *Schedule expression*, eg. `rate(1 minute)`.
   1. Click **Enable trigger** (or don't if you want to test thoroughly).
1. In the *Configure function* step...
   1. Fill in a *Name*, eg. `commander`.
   1. For *Runtime*, pick **Node.js 6.10** or above.
   1. Provide the function code however you wish. Editing code inline and copy-pasting the content of either `target-auto-scaling-group.js` or `target-instance.js` is a quick way.
   1. Keep *Handler* as the default `index.handler`.
   1. For *Role*, pick **Create a custom role**. A new tab opens for IAM.
      1. Fill in a *Role Name*, eg. `commander-role`.
      1. Click on **View Policy Document**, then **Edit**.
      1. Copy-paste the content of `iam-role.json`. This will allow two additional actions for these functions.
      1. After you click **Allow**, the new tab will close and you'll get back to defining the Lambda function.
   1. Under *Advanced settings* set *Timeout* to **10 seconds**. Node.js functions can sometimes go past the default 3.
1. After creating the function you should define its parameters at CloudWatch Events, then enabled it.
   1. At the function's *Triggers* tab, click on the CloudWatch Event name to jump to its configuration.
   1. At the top right, click **Actions** and **Edit**.
   1. In the *Targets* section, click **Add target**.
   1. The **Lambda function** should be preselected, so pick the function name for *Function*.
   1. Expand **Configure input**.
   1. Pick **Constant (JSON text)**.
   1. Copy-paste suitable parameters from the *Parameters* section above. Edit according to your needs.
   1. Continue to the next step by clicking **Configure details**.
   1. *State* should already be checked, so click on **Update rule** to get things going.

## License

Licensed under the [Apache 2.0 License](https://opensource.org/licenses/Apache-2.0).

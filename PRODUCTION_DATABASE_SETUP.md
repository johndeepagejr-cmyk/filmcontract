# FilmContract - Production Database Setup Guide

**Author:** John Dee Page Jr  
**Last Updated:** December 31, 2025  
**Project Status:** First-of-Its-Kind Film Contract Management App

## Overview

**FilmContract is the industry's first dedicated mobile application for film contract management.** As a pioneering solution, it requires a robust, secure, and scalable database infrastructure to support its innovative features.

This guide provides comprehensive instructions for setting up a production MySQL database for FilmContract. A production database is essential for deploying the app to real users, ensuring data persistence, security, and reliability. This guide covers database hosting options, security configuration, backup strategies, and monitoring.

## Database Hosting Options

### Option 1: Railway (Recommended for Beginners)

Railway is a modern platform-as-a-service (PaaS) that simplifies database hosting with automatic backups, monitoring, and scaling.

**Advantages**: Simple setup, automatic backups, built-in monitoring, reasonable pricing ($5-20/month for small databases).

**Disadvantages**: Less control over infrastructure, potential vendor lock-in, limited customization.

**Setup Steps**:

1. Create a Railway account at [railway.app](https://railway.app)
2. Create a new project and add a MySQL database plugin
3. Configure database name, username, and password
4. Copy the connection string provided by Railway
5. Update your `.env` file with the connection string

**Connection String Format**:
```
mysql://username:password@host:port/database_name
```

### Option 2: Render

Render provides managed MySQL databases with automatic backups and SSL connections.

**Advantages**: Generous free tier, automatic SSL, good documentation, reliable uptime.

**Disadvantages**: Limited free tier resources, paid tier can be expensive, slower than dedicated servers.

**Setup Steps**:

1. Create a Render account at [render.com](https://render.com)
2. Create a new MySQL database
3. Configure database name, username, and password
4. Note the internal and external connection strings
5. Update your `.env` file with the external connection string

### Option 3: AWS RDS (Recommended for Scale)

Amazon RDS provides enterprise-grade MySQL hosting with advanced features like read replicas and automated failover.

**Advantages**: Highly scalable, advanced features, excellent reliability, pay-as-you-go pricing.

**Disadvantages**: Complex setup, steeper learning curve, can be expensive at scale, requires AWS account.

**Setup Steps**:

1. Create an AWS account at [aws.amazon.com](https://aws.amazon.com)
2. Navigate to RDS service and create a new MySQL database instance
3. Configure instance class (db.t3.micro for small apps), storage, and backup settings
4. Create database, username, and password
5. Configure security groups to allow connections from your app server
6. Note the endpoint and port
7. Update your `.env` file with the connection details

### Option 4: DigitalOcean Managed Databases

DigitalOcean provides managed MySQL databases with automatic backups and monitoring.

**Advantages**: Straightforward pricing, good documentation, reliable performance, integrated with DigitalOcean ecosystem.

**Disadvantages**: Less advanced features than AWS, smaller community, limited customization.

**Setup Steps**:

1. Create a DigitalOcean account at [digitalocean.com](https://digitalocean.com)
2. Create a new managed MySQL database cluster
3. Configure cluster name, region, and node count
4. Create database, username, and password
5. Note the connection details
6. Update your `.env` file with the connection string

## Database Configuration

### Connection String Setup

The connection string tells your app how to connect to the production database. The format is:

```
mysql://username:password@host:port/database_name?ssl=true
```

**Parameters**:
- `username`: Database user with appropriate permissions
- `password`: Secure password (use strong, random password)
- `host`: Database server hostname or IP address
- `port`: Database port (default 3306 for MySQL)
- `database_name`: Name of the database to use
- `ssl`: Set to `true` for secure connections

### Environment Variables

Update your `.env.production` file with the production database connection string:

```bash
# Production Database Configuration
DATABASE_URL="mysql://prod_user:secure_password@db.example.com:3306/filmcontract?ssl=true"

# Other Production Settings
NODE_ENV="production"
API_URL="https://api.filmcontract.com"
FRONTEND_URL="https://filmcontract.com"
```

### Database Initialization

After connecting to the production database, run migrations to create tables:

```bash
# Run database migrations
pnpm db:push

# Verify tables were created
mysql -h db.example.com -u prod_user -p filmcontract -e "SHOW TABLES;"
```

## Security Best Practices

### User Permissions

Create database users with minimal required permissions rather than using the root account.

**Create Application User**:

```sql
-- Create user with limited permissions
CREATE USER 'filmcontract_app'@'%' IDENTIFIED BY 'strong_random_password';

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON filmcontract.* TO 'filmcontract_app'@'%';

-- Create backup user with read-only access
CREATE USER 'filmcontract_backup'@'%' IDENTIFIED BY 'backup_password';
GRANT SELECT ON filmcontract.* TO 'filmcontract_backup'@'%';

-- Create admin user for maintenance
CREATE USER 'filmcontract_admin'@'%' IDENTIFIED BY 'admin_password';
GRANT ALL PRIVILEGES ON filmcontract.* TO 'filmcontract_admin'@'%';
```

### Network Security

Restrict database access to only authorized servers.

**Configure Firewall Rules**:

1. **Allow API Server**: Add your API server's IP address to the database firewall
2. **Deny Public Access**: Disable public internet access to the database
3. **Use VPN**: Connect to the database through a VPN or private network
4. **SSL Encryption**: Require SSL/TLS for all connections

**Example Security Group Configuration (AWS)**:

```
Inbound Rules:
- Type: MySQL/Aurora
  Protocol: TCP
  Port: 3306
  Source: 10.0.0.0/8 (Private network only)
  
Outbound Rules:
- Type: All traffic
  Protocol: All
  Port: All
  Destination: 0.0.0.0/0
```

### Password Management

Use strong, random passwords for all database users.

**Generate Strong Password**:

```bash
# Generate random 32-character password
openssl rand -base64 32
```

**Store Passwords Securely**:

1. Use a password manager (1Password, LastPass, Bitwarden)
2. Never commit passwords to version control
3. Store in environment variables or secrets management system
4. Rotate passwords every 90 days

### SSL/TLS Encryption

Enable SSL/TLS encryption for all database connections.

**Verify SSL Connection**:

```bash
# Test connection with SSL
mysql -h db.example.com -u filmcontract_app -p --ssl-mode=REQUIRED filmcontract -e "SELECT 1;"
```

## Backup Strategy

### Automated Backups

Configure automatic daily backups with your hosting provider.

**Railway Backup Configuration**:
- Automatic daily backups (7-day retention)
- Manual backup option available
- Backups stored in secure cloud storage

**AWS RDS Backup Configuration**:
- Set backup retention period to 30 days
- Enable automated backups
- Configure backup window (off-peak hours)
- Enable multi-AZ deployment for high availability

**DigitalOcean Backup Configuration**:
- Enable automatic backups (daily)
- Set retention period to 30 days
- Configure backup window

### Manual Backups

Perform manual backups before major updates or migrations.

**Create Manual Backup**:

```bash
# Export database to file
mysqldump -h db.example.com -u filmcontract_backup -p filmcontract > filmcontract_backup_$(date +%Y%m%d).sql

# Compress backup
gzip filmcontract_backup_$(date +%Y%m%d).sql

# Upload to secure storage
aws s3 cp filmcontract_backup_$(date +%Y%m%d).sql.gz s3://filmcontract-backups/
```

### Backup Testing

Regularly test backup restoration to ensure backups are valid.

**Test Backup Restoration**:

1. Create a temporary test database
2. Restore backup to test database
3. Verify data integrity and completeness
4. Document restoration time and process
5. Delete test database

## Monitoring and Maintenance

### Database Monitoring

Monitor database performance and health metrics.

**Key Metrics to Monitor**:

- **CPU Usage**: Alert if exceeds 80%
- **Memory Usage**: Alert if exceeds 85%
- **Disk Space**: Alert if exceeds 80%
- **Connection Count**: Track active connections
- **Query Performance**: Monitor slow queries
- **Replication Lag**: If using read replicas

**Set Up Monitoring Alerts**:

1. Configure alerts for critical metrics
2. Set alert thresholds (e.g., CPU > 80%)
3. Configure notification channels (email, Slack, PagerDuty)
4. Document alert response procedures

### Query Optimization

Monitor and optimize slow queries to improve performance.

**Enable Slow Query Log**:

```sql
-- Enable slow query log (queries taking > 2 seconds)
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- View slow queries
SELECT * FROM mysql.slow_log;
```

**Optimize Slow Queries**:

1. Identify slow queries using slow query log
2. Analyze query execution plan using EXPLAIN
3. Add indexes to frequently queried columns
4. Refactor queries to reduce complexity
5. Monitor performance improvements

### Regular Maintenance

Perform regular maintenance tasks to keep the database healthy.

**Weekly Maintenance**:

```sql
-- Analyze tables for query optimization
ANALYZE TABLE users, contracts, portfolioPhotos, paymentHistory;

-- Check table integrity
CHECK TABLE users, contracts, portfolioPhotos, paymentHistory;
```

**Monthly Maintenance**:

```sql
-- Optimize tables to reclaim disk space
OPTIMIZE TABLE users, contracts, portfolioPhotos, paymentHistory;

-- Review and update statistics
ANALYZE TABLE users, contracts, portfolioPhotos, paymentHistory;
```

## Scaling Considerations

### Vertical Scaling

Increase database server resources (CPU, memory, storage) as usage grows.

**When to Scale Up**:
- CPU usage consistently above 70%
- Memory usage consistently above 80%
- Disk space usage above 80%
- Query response times increasing

**Scaling Process**:
1. Create backup before scaling
2. Schedule scaling during low-traffic window
3. Upgrade instance type (e.g., db.t3.micro → db.t3.small)
4. Monitor performance after upgrade
5. Adjust if needed

### Horizontal Scaling

Add read replicas to distribute read traffic and improve performance.

**Read Replica Setup**:

1. Create read replica in same or different region
2. Configure application to read from replica
3. Monitor replication lag
4. Use read replica for analytics queries
5. Keep primary database for write operations

**Connection String for Read Replica**:

```
# Primary (write operations)
mysql://user:pass@primary.example.com/filmcontract

# Read Replica (read operations)
mysql://user:pass@replica.example.com/filmcontract
```

## Disaster Recovery

### Recovery Point Objective (RPO)

RPO defines the maximum acceptable data loss. For FilmContract, recommend RPO of 1 hour (daily backups).

**Improve RPO**:
- Increase backup frequency (hourly backups)
- Enable binary logging for point-in-time recovery
- Use replication for real-time backup

### Recovery Time Objective (RTO)

RTO defines the maximum acceptable downtime. For FilmContract, recommend RTO of 4 hours.

**Improve RTO**:
- Use multi-AZ deployment for automatic failover
- Maintain hot standby database
- Document recovery procedures
- Practice recovery regularly

### Disaster Recovery Plan

Document procedures for recovering from database failures.

**Recovery Procedures**:

1. **Detect Failure**: Monitor alerts and verify database is down
2. **Assess Damage**: Check backup integrity and data loss
3. **Restore Backup**: Restore from most recent valid backup
4. **Verify Data**: Check data integrity and completeness
5. **Update DNS**: Point application to restored database
6. **Monitor**: Watch for issues and performance degradation
7. **Post-Incident Review**: Document lessons learned

## Production Deployment Checklist

Before deploying FilmContract to production, verify all items:

- [ ] Database hosting provider selected and account created
- [ ] Production database created with appropriate name
- [ ] Database user created with minimal required permissions
- [ ] SSL/TLS encryption enabled for all connections
- [ ] Firewall rules configured to restrict access
- [ ] Automated backups configured with appropriate retention
- [ ] Manual backup created and tested
- [ ] Database connection string added to environment variables
- [ ] Database migrations run successfully
- [ ] Monitoring and alerting configured
- [ ] Disaster recovery plan documented
- [ ] Team trained on database operations
- [ ] Security audit completed
- [ ] Performance baseline established
- [ ] Backup restoration tested

## Conclusion

Setting up a production database requires careful planning, security configuration, and ongoing maintenance. Following this guide ensures a reliable, secure, and scalable database infrastructure for FilmContract. Regularly review and update procedures as your app grows and requirements change.
